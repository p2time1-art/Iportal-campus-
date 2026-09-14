import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  getGatewayConfig, verifyPaystackTransaction, processSuccessfulPayment,
  markTransactionFailed
} from '../../shared/paymentsGateway.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { internal_reference } = body;

    if (!internal_reference) {
      return Response.json({ error: 'Internal reference is required' }, { status: 400 });
    }

    // Look up the transaction (service role — we verify authorization manually)
    const txns = await base44.asServiceRole.entities.OnlinePaymentTransaction.filter(
      { internal_reference }, '-created_date', 5
    );

    if (!txns || txns.length === 0) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const txn = txns[0];

    // Authorization: user must be the payer, the student, or a school admin
    const isPayer = txn.payer_user_id === user.id;
    const isStudent = txn.student_user_id === user.id;
    const isSchoolAdmin = !!(user.data?.is_school_admin || user.data?.is_super_admin || user.role === 'admin');
    const sameSchool = txn.school_id === (user.data?.active_school_id || '');

    if (!isPayer && !isStudent && !(isSchoolAdmin && sameSchool)) {
      return Response.json({ error: 'Not authorized to view this transaction' }, { status: 403 });
    }

    // Idempotency: already processed
    if (txn.status === 'success' && txn.payment_id) {
      return Response.json({
        status: 'success',
        already_processed: true,
        transaction: txn,
        message: 'This payment has already been verified and processed.'
      });
    }

    // If already failed/cancelled/expired, return current status
    if (['failed', 'cancelled', 'expired', 'reversed'].includes(txn.status)) {
      return Response.json({ status: txn.status, transaction: txn });
    }

    // Get gateway config and verify with Paystack
    const config = await getGatewayConfig(base44, txn.school_id);
    if (!config.secretKey) {
      return Response.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const gatewayData = await verifyPaystackTransaction(config.secretKey, txn.internal_reference);

    // Validate amount (gateway returns kobo, we store Naira)
    const gatewayAmountNaira = Number(gatewayData.amount) / 100;
    if (Math.abs(gatewayAmountNaira - Number(txn.amount)) > 0.01) {
      // Amount mismatch — critical security failure
      await markTransactionFailed(base44, txn.id, `Amount mismatch: expected ₦${txn.amount}, got ₦${gatewayAmountNaira}`);
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          actor_user_id: user.id,
          actor_name: user.full_name || '',
          actor_role: 'system',
          school_id: txn.school_id,
          school_name: txn.school_name || '',
          action: 'PAYMENT_VERIFICATION_FAILED',
          entity_type: 'OnlinePaymentTransaction',
          entity_id: txn.id,
          description: `Amount mismatch: expected ₦${txn.amount}, gateway returned ₦${gatewayAmountNaira}`,
          metadata: { internal_reference: txn.internal_reference, gateway_amount: gatewayAmountNaira }
        });
      } catch (_e) { /* non-fatal */ }
      return Response.json({ error: 'Payment amount mismatch detected. Please contact support.' }, { status: 400 });
    }

    // Validate currency
    if (gatewayData.currency && gatewayData.currency !== txn.currency) {
      await markTransactionFailed(base44, txn.id, `Currency mismatch: expected ${txn.currency}, got ${gatewayData.currency}`);
      return Response.json({ error: 'Currency mismatch detected. Please contact support.' }, { status: 400 });
    }

    // Process based on gateway status
    if (gatewayData.status === 'success') {
      const result = await processSuccessfulPayment(base44, txn, gatewayData);
      return Response.json({
        status: 'success',
        already_processed: result.already_processed,
        payment_id: result.payment_id,
        receipt_id: result.receipt_id,
        receipt_number: result.receipt_number,
        message: result.already_processed ? 'Payment already processed.' : 'Payment verified and processed successfully.'
      });
    } else if (gatewayData.status === 'failed') {
      await markTransactionFailed(base44, txn.id, gatewayData.gateway_response || 'Payment failed at gateway');
      return Response.json({ status: 'failed', message: 'Payment was not successful.' });
    } else {
      // Still pending
      return Response.json({ status: 'pending', message: 'Payment is still being confirmed. Please wait a moment.' });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}