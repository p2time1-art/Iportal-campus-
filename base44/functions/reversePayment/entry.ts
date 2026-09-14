import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { payment_id, action, reason } = body;

    if (!payment_id) return Response.json({ error: 'Payment ID is required' }, { status: 400 });
    if (!['reverse', 'refund', 'fail', 'cancel'].includes(action)) {
      return Response.json({ error: 'Invalid action. Use: reverse, refund, fail, or cancel' }, { status: 400 });
    }

    // Get payment
    const payment = await base44.entities.Payment.get(payment_id).catch(() => null);
    if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 });

    // Authorization: verify user belongs to the payment's school
    const userSchoolId = user.data?.active_school_id || '';
    const isSuperAdmin = user.data?.is_super_admin || user.role === 'admin';
    if (!isSuperAdmin && payment.school_id !== userSchoolId) {
      return Response.json({ error: 'Not authorized for this school' }, { status: 403 });
    }

    // Only successful payments can be reversed/refunded
    if (payment.status !== 'successful') {
      return Response.json({ error: `Cannot ${action} a payment with status: ${payment.status}` }, { status: 400 });
    }

    const newStatus = action === 'reverse' ? 'reversed' : action === 'refund' ? 'refunded' : action === 'fail' ? 'failed' : 'cancelled';

    // Get allocations for this payment
    const allocations = await base44.asServiceRole.entities.PaymentAllocation.filter(
      { school_id: payment.school_id, payment_id }, '-created_date', 500
    );

    // Reverse each allocation by subtracting from charge's amount_paid
    let reversedCount = 0;
    for (const alloc of (allocations || [])) {
      const charge = await base44.asServiceRole.entities.StudentCharge.get(alloc.student_charge_id).catch(() => null);
      if (charge) {
        const newAmountPaid = Math.max(0, (Number(charge.amount_paid) || 0) - (Number(alloc.amount) || 0));
        const netAmount = Number(charge.net_amount) || 0;
        let chargeStatus = charge.status;
        if (newAmountPaid <= 0) {
          chargeStatus = charge.status === 'overdue' ? 'overdue' : 'pending';
        } else if (newAmountPaid < netAmount) {
          chargeStatus = 'partially_paid';
        }
        await base44.asServiceRole.entities.StudentCharge.update(charge.id, {
          amount_paid: newAmountPaid,
          status: chargeStatus
        });
        reversedCount++;
      }
    }

    // Update payment status (keep original transaction for audit)
    const now = new Date().toISOString();
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
    const noteAddition = `\n[${now}] ${actionLabel.toUpperCase()}: ${reason || 'No reason provided'} by ${user.full_name || user.id}`;
    await base44.entities.Payment.update(payment_id, {
      status: newStatus,
      notes: (payment.notes || '') + noteAddition
    });

    return Response.json({
      payment_id,
      new_status: newStatus,
      allocations_reversed: reversedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}