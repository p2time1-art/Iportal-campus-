import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  getGatewayConfig, verifyPaystackTransaction, validatePaystackSignatureAsync,
  processSuccessfulPayment, markTransactionFailed, resolveWebhookSecret
} from '../../shared/paymentsGateway.ts';

/**
 * Paystack webhook handler.
 * Receives payment events from Paystack and processes successful payments.
 *
 * Security:
 * - No user auth (called by Paystack)
 * - Signature validation required
 * - Idempotency: duplicate events do not create duplicate payments
 * - Amount/currency validation before processing
 *
 * Webhook URL: https://iportal.base44.app/functions/handlePaystackWebhook
 */
export default async function(req) {
  try {
    // Read raw body for signature validation
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // Parse the body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (_e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Only process charge.success events (safe to check before signature validation — just filtering)
    if (body.event !== 'charge.success') {
      return Response.json({ status: 'ignored', event: body.event });
    }

    const gatewayData = body.data;
    if (!gatewayData || !gatewayData.reference) {
      return Response.json({ error: 'Missing transaction reference in webhook data' }, { status: 400 });
    }

    // Look up our transaction by the reference to identify the school.
    // This is needed to resolve the correct per-school webhook secret.
    // We do NOT act on the body until after signature validation.
    const txns = await base44.asServiceRole.entities.OnlinePaymentTransaction.filter(
      { internal_reference: gatewayData.reference }, '-created_date', 5
    );

    if (!txns || txns.length === 0) {
      return Response.json({ status: 'ignored', reason: 'Transaction not found' });
    }

    const txn = txns[0];

    // Resolve webhook secret: try school-specific encrypted secret, fall back to platform
    const webhookSecret = await resolveWebhookSecret(base44, txn.school_id);

    if (!webhookSecret) {
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Validate signature with the resolved per-school webhook secret
    const isValid = await validatePaystackSignatureAsync(webhookSecret, rawBody, signature);
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Idempotency: already processed
    if (txn.status === 'success' && txn.payment_id) {
      // Duplicate webhook — already processed
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          actor_user_id: 'paystack_webhook',
          actor_name: 'Paystack Webhook',
          actor_role: 'system',
          school_id: txn.school_id,
          school_name: txn.school_name || '',
          action: 'PAYMENT_WEBHOOK_DUPLICATE',
          entity_type: 'OnlinePaymentTransaction',
          entity_id: txn.id,
          description: `Duplicate webhook received for already-processed transaction ${txn.internal_reference}`,
          metadata: { internal_reference: txn.internal_reference, gateway_reference: gatewayData.reference }
        });
      } catch (_e) { /* non-fatal */ }
      return Response.json({ status: 'already_processed' });
    }

    // If already failed/cancelled, don't reprocess
    if (['failed', 'cancelled', 'expired', 'reversed'].includes(txn.status)) {
      return Response.json({ status: txn.status, reason: 'Transaction already terminal' });
    }

    // Validate amount (gateway returns kobo, we store Naira)
    const gatewayAmountNaira = Number(gatewayData.amount) / 100;
    if (Math.abs(gatewayAmountNaira - Number(txn.amount)) > 0.01) {
      await markTransactionFailed(base44, txn.id,
        `Amount mismatch in webhook: expected ₦${txn.amount}, got ₦${gatewayAmountNaira}`);
      return Response.json({ status: 'failed', reason: 'Amount mismatch' });
    }

    // Validate currency
    if (gatewayData.currency && gatewayData.currency !== txn.currency) {
      await markTransactionFailed(base44, txn.id,
        `Currency mismatch in webhook: expected ${txn.currency}, got ${gatewayData.currency}`);
      return Response.json({ status: 'failed', reason: 'Currency mismatch' });
    }

    // Log webhook received
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        actor_user_id: 'paystack_webhook',
        actor_name: 'Paystack Webhook',
        actor_role: 'system',
        school_id: txn.school_id,
        school_name: txn.school_name || '',
        action: 'PAYMENT_WEBHOOK_RECEIVED',
        entity_type: 'OnlinePaymentTransaction',
        entity_id: txn.id,
        description: `Webhook received for ${txn.internal_reference}, amount ₦${gatewayAmountNaira}`,
        metadata: { internal_reference: txn.internal_reference, gateway_reference: gatewayData.reference }
      });
    } catch (_e) { /* non-fatal */ }

    // Process the successful payment
    if (gatewayData.status === 'success') {
      const result = await processSuccessfulPayment(base44, txn, gatewayData);

      // Log webhook processed
      try {
        await base44.asServiceRole.entities.AuditLog.create({
          actor_user_id: 'paystack_webhook',
          actor_name: 'Paystack Webhook',
          actor_role: 'system',
          school_id: txn.school_id,
          school_name: txn.school_name || '',
          action: 'PAYMENT_WEBHOOK_PROCESSED',
          entity_type: 'OnlinePaymentTransaction',
          entity_id: txn.id,
          description: `Webhook processed: payment ${txn.internal_reference} → Payment ${result.payment_id}, Receipt ${result.receipt_number}`,
          metadata: { internal_reference: txn.internal_reference, payment_id: result.payment_id }
        });
      } catch (_e) { /* non-fatal */ }

      return Response.json({ status: 'success', payment_id: result.payment_id });
    } else {
      await markTransactionFailed(base44, txn.id, gatewayData.gateway_response || 'Payment failed at gateway');
      return Response.json({ status: 'failed' });
    }
  } catch (error) {
    // Return 500 so Paystack retries
    return Response.json({ error: error.message }, { status: 500 });
  }
}