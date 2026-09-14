import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  generateInternalReference, getGatewayConfig, assertGatewayReady,
  initializePaystackTransaction
} from '../../shared/paymentsGateway.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { student_id, charge_ids, amount, callback_url } = body;

    if (!student_id || !charge_ids || !charge_ids.length || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const schoolId = user.data?.active_school_id || '';
    if (!schoolId) return Response.json({ error: 'No active school context' }, { status: 400 });

    // Verify student belongs to this school
    const student = await base44.entities.Student.get(student_id).catch(() => null);
    if (!student) return Response.json({ error: 'Student not found' }, { status: 404 });
    if (student.school_id !== schoolId) {
      return Response.json({ error: 'Student does not belong to this school' }, { status: 403 });
    }

    // Verify user is authorized to pay for this student (student themselves or parent/guardian)
    let authorized = false;
    if (student.user_id && student.user_id === user.id) authorized = true;
    if (!authorized) {
      const guardians = await base44.asServiceRole.entities.ParentGuardian.filter(
        { user_id: user.id }, '-created_date', 50
      );
      if (guardians && guardians.length > 0) {
        for (const g of guardians) {
          const rels = await base44.asServiceRole.entities.GuardianRelationship.filter(
            { school_id: schoolId, student_id, guardian_id: g.id }, '-created_date', 10
          );
          if (rels && rels.length > 0) { authorized = true; break; }
        }
      }
    }
    if (!authorized) {
      return Response.json({ error: 'Not authorized to pay for this student' }, { status: 403 });
    }

    // Get gateway config
    const config = await getGatewayConfig(base44, schoolId);
    assertGatewayReady(config);

    // Validate charges and calculate allocation plan
    const allCharges = await base44.asServiceRole.entities.StudentCharge.filter(
      { school_id: schoolId, student_id }, 'due_date', 500
    );

    let totalOutstanding = 0;
    const allocationPlan = [];
    const validChargeIds = [];

    for (const cid of charge_ids) {
      const charge = (allCharges || []).find(c => c.id === cid);
      if (!charge) return Response.json({ error: 'Charge not found' }, { status: 400 });
      if (!['pending', 'partially_paid', 'overdue'].includes(charge.status)) {
        return Response.json({ error: `Charge "${charge.category_name}" is not outstanding` }, { status: 400 });
      }
      const owed = (Number(charge.net_amount) || 0) - (Number(charge.amount_paid) || 0);
      if (owed <= 0) {
        return Response.json({ error: `Charge "${charge.category_name}" has no outstanding balance` }, { status: 400 });
      }
      allocationPlan.push({ charge_id: charge.id, category_name: charge.category_name || '', amount: owed });
      validChargeIds.push(charge.id);
      totalOutstanding += owed;
    }

    // Validate payment amount
    const payAmount = Number(amount);
    if (payAmount <= 0) return Response.json({ error: 'Amount must be positive' }, { status: 400 });
    if (payAmount > totalOutstanding) {
      return Response.json({
        error: `Payment amount exceeds total outstanding balance of ₦${totalOutstanding.toLocaleString()}`
      }, { status: 400 });
    }

    // If partial payment, allocate FIFO
    if (payAmount < totalOutstanding) {
      let remaining = payAmount;
      const adjusted = [];
      for (const alloc of allocationPlan) {
        if (remaining <= 0) break;
        const allocAmount = Math.min(remaining, alloc.amount);
        adjusted.push({ ...alloc, amount: allocAmount });
        remaining -= allocAmount;
      }
      allocationPlan.length = 0;
      allocationPlan.push(...adjusted);
    }

    // Prevent double-click: check for existing pending transaction
    const existingPending = await base44.asServiceRole.entities.OnlinePaymentTransaction.filter(
      { school_id: schoolId, student_id, payer_user_id: user.id, status: 'pending' },
      '-created_date', 5
    );
    if (existingPending && existingPending.length > 0) {
      const existing = existingPending[0];
      if (existing.authorization_url) {
        return Response.json({
          transaction_id: existing.id,
          internal_reference: existing.internal_reference,
          authorization_url: existing.authorization_url,
          message: 'You have a pending payment. Please complete it before starting a new one.'
        });
      }
    }

    // Generate internal reference
    const internalRef = generateInternalReference();

    // Get session/term info
    let sessionName = '', termName = '', sessionId = '', termId = '';
    const sessions = await base44.asServiceRole.entities.AcademicSession.filter(
      { school_id: schoolId, is_active: true }, '-created_date', 5
    );
    if (sessions && sessions.length > 0) {
      sessionId = sessions[0].id;
      sessionName = sessions[0].name;
      const terms = await base44.asServiceRole.entities.Term.filter(
        { school_id: schoolId, session_id: sessionId, is_current: true }, '-created_date', 5
      );
      if (terms && terms.length > 0) { termId = terms[0].id; termName = terms[0].name; }
    }

    const school = await base44.asServiceRole.entities.School.get(schoolId).catch(() => null);

    // Create the OnlinePaymentTransaction
    const txn = await base44.asServiceRole.entities.OnlinePaymentTransaction.create({
      school_id: schoolId,
      school_name: school?.name || '',
      student_id,
      student_name: student.full_name,
      student_user_id: student.user_id || '',
      admission_number: student.admission_number || '',
      payer_user_id: user.id,
      payer_name: user.full_name || user.email,
      payer_email: user.email,
      gateway: 'paystack',
      internal_reference: internalRef,
      amount: payAmount,
      currency: config.currency,
      status: 'initiated',
      charge_ids: validChargeIds,
      allocation_plan: allocationPlan,
      session_name: sessionName,
      term_name: termName,
      class_name: student.current_class_name || '',
      academic_session_id: sessionId,
      term_id: termId,
      environment: config.environment,
      initiated_at: new Date().toISOString(),
      callback_url: callback_url || '',
      metadata: { charge_count: validChargeIds.length }
    });

    // Initialize with Paystack
    const callbackUrl = callback_url || `https://iportal.base44.app/app/payment-status?ref=${internalRef}`;

    const paystackData = await initializePaystackTransaction(config.secretKey, {
      email: user.email,
      amount: payAmount,
      reference: internalRef,
      callback_url: callbackUrl,
      currency: config.currency,
      metadata: {
        student_id, student_name: student.full_name, school_id: schoolId,
        internal_reference: internalRef,
        custom_fields: [
          { display_name: 'Student', variable_name: 'student', value: student.full_name },
          { display_name: 'Admission No', variable_name: 'admission_no', value: student.admission_number || 'N/A' },
          { display_name: 'Reference', variable_name: 'ref', value: internalRef }
        ]
      }
    });

    // Update transaction with gateway reference and authorization URL
    await base44.asServiceRole.entities.OnlinePaymentTransaction.update(txn.id, {
      gateway_reference: paystackData.reference,
      authorization_url: paystackData.authorization_url,
      status: 'pending'
    });

    // Audit log
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        actor_user_id: user.id,
        actor_name: user.full_name || user.email,
        actor_role: user.data?.active_role || '',
        school_id: schoolId,
        school_name: school?.name || '',
        action: 'ONLINE_PAYMENT_INITIATED',
        entity_type: 'OnlinePaymentTransaction',
        entity_id: txn.id,
        description: `Initiated online payment of ₦${payAmount.toLocaleString()} for ${student.full_name}`,
        metadata: { internal_reference: internalRef, amount: payAmount, charge_ids: validChargeIds }
      });
    } catch (_e) { /* non-fatal */ }

    return Response.json({
      transaction_id: txn.id,
      internal_reference: internalRef,
      authorization_url: paystackData.authorization_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}