import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function formatNaira(n) {
  return '\u20A6' + Number(n || 0).toLocaleString('en-NG');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      school_id, student_id, amount, payment_method, payment_date,
      payment_reference, academic_session_id, term_id, notes, allocate_to
    } = body;

    if (!school_id || !student_id || !amount || !payment_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (Number(amount) <= 0) {
      return Response.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Authorization: verify user belongs to this school
    const userSchoolId = user.data?.active_school_id || '';
    const isSuperAdmin = user.data?.is_super_admin || user.role === 'admin';
    if (!isSuperAdmin && userSchoolId !== school_id) {
      return Response.json({ error: 'Not authorized for this school' }, { status: 403 });
    }

    // Duplicate payment reference check
    if (payment_reference && payment_reference.trim()) {
      const existing = await base44.asServiceRole.entities.Payment.filter(
        { school_id, payment_reference: payment_reference.trim() }, '-created_date', 1
      );
      if (existing && existing.length > 0) {
        return Response.json({ error: 'A payment with this reference already exists' }, { status: 409 });
      }
    }

    // Get student
    const student = await base44.entities.Student.get(student_id).catch(() => null);
    if (!student) return Response.json({ error: 'Student not found' }, { status: 404 });

    // Verify student belongs to the same school
    if (student.school_id !== school_id) {
      return Response.json({ error: 'Student does not belong to this school' }, { status: 400 });
    }

    // Get session/term names
    let session_name = '';
    let term_name = '';
    if (academic_session_id) {
      const session = await base44.entities.AcademicSession.get(academic_session_id).catch(() => null);
      session_name = session?.name || '';
    }
    if (term_id) {
      const term = await base44.entities.Term.get(term_id).catch(() => null);
      term_name = term?.name || '';
    }

    // Calculate allocations BEFORE creating any records (overpayment check)
    let allocations = [];
    if (allocate_to && allocate_to.length > 0) {
      // Manual allocation — validate each allocation
      let manualTotal = 0;
      for (const alloc of allocate_to) {
        const allocAmt = Number(alloc.amount);
        if (!allocAmt || allocAmt <= 0) {
          return Response.json({ error: 'Each allocation amount must be positive' }, { status: 400 });
        }
        const charge = await base44.entities.StudentCharge.get(alloc.charge_id).catch(() => null);
        if (!charge || charge.student_id !== student_id) {
          return Response.json({ error: 'Invalid charge in allocation' }, { status: 400 });
        }
        const owed = (Number(charge.net_amount) || 0) - (Number(charge.amount_paid) || 0);
        if (allocAmt > owed) {
          return Response.json({ error: `Allocation of ${formatNaira(allocAmt)} exceeds outstanding balance of ${formatNaira(owed)} for ${charge.category_name}` }, { status: 400 });
        }
        allocations.push({ charge_id: alloc.charge_id, amount: allocAmt, category_name: alloc.category_name || charge.category_name || '' });
        manualTotal += allocAmt;
      }
      if (manualTotal > Number(amount)) {
        return Response.json({ error: `Total allocations (${formatNaira(manualTotal)}) exceed payment amount (${formatNaira(amount)})` }, { status: 400 });
      }
    } else {
      // Auto-allocate: oldest outstanding charges first (FIFO by due_date)
      const allCharges = await base44.entities.StudentCharge.filter(
        { school_id, student_id }, 'due_date', 500
      );
      const outstanding = (allCharges || []).filter(c =>
        ['pending', 'partially_paid', 'overdue'].includes(c.status)
      );

      let remaining = Number(amount);
      for (const charge of outstanding) {
        if (remaining <= 0) break;
        const owed = (Number(charge.net_amount) || 0) - (Number(charge.amount_paid) || 0);
        if (owed <= 0) continue;
        const allocAmount = Math.min(remaining, owed);
        allocations.push({ charge_id: charge.id, amount: allocAmount, category_name: charge.category_name || '' });
        remaining -= allocAmount;
      }

      // Overpayment protection: reject if payment exceeds total outstanding
      if (remaining > 0) {
        const totalOutstanding = Number(amount) - remaining;
        return Response.json({
          error: `Payment of ${formatNaira(amount)} exceeds total outstanding balance of ${formatNaira(totalOutstanding)} by ${formatNaira(remaining)}. Please reduce the amount or create additional charges first.`
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    // 1. Create payment (pending)
    const payment = await base44.entities.Payment.create({
      school_id,
      student_id,
      student_name: student.full_name,
      student_user_id: student.user_id || '',
      admission_number: student.admission_number || '',
      amount: Number(amount),
      payment_reference: payment_reference || '',
      payment_method: payment_method || 'cash',
      payment_date,
      academic_session_id: academic_session_id || '',
      session_name,
      term_id: term_id || '',
      term_name,
      status: 'pending',
      recorded_by_id: user.id,
      recorded_by_name: user.full_name || '',
      notes: notes || ''
    });

    // 2. Verify payment (admin-recorded payments are verified on creation)
    await base44.entities.Payment.update(payment.id, {
      status: 'successful',
      verified_by_id: user.id,
      verified_by_name: user.full_name || '',
      verified_at: now
    });

    // 3. Create allocation records and update charges
    for (const alloc of allocations) {
      await base44.entities.PaymentAllocation.create({
        school_id,
        payment_id: payment.id,
        student_charge_id: alloc.charge_id,
        student_id,
        amount: alloc.amount,
        category_name: alloc.category_name
      });

      const charge = await base44.entities.StudentCharge.get(alloc.charge_id).catch(() => null);
      if (charge) {
        const newAmountPaid = (Number(charge.amount_paid) || 0) + alloc.amount;
        const netAmount = Number(charge.net_amount) || 0;
        let newStatus = charge.status;
        if (newAmountPaid >= netAmount) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partially_paid';
        }
        await base44.entities.StudentCharge.update(charge.id, {
          amount_paid: newAmountPaid,
          status: newStatus
        });
      }
    }

    // 4. Generate unique receipt number: RCP/YEAR/timestamp+random (collision-resistant)
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
    const receiptNumber = `RCP/${year}/${stamp}${rand}`;

    // 5. Create receipt
    const receipt = await base44.entities.Receipt.create({
      school_id,
      student_id,
      student_name: student.full_name,
      student_user_id: student.user_id || '',
      admission_number: student.admission_number || '',
      payment_id: payment.id,
      receipt_number: receiptNumber,
      receipt_date: payment_date,
      amount: Number(amount),
      payment_method: payment_method || 'cash',
      payment_reference: payment_reference || '',
      session_name,
      term_name,
      class_name: student.current_class_name || '',
      generated_at: now,
      generated_by_id: user.id,
      generated_by_name: user.full_name || ''
    });

    // 6. Link receipt to payment
    await base44.entities.Payment.update(payment.id, { receipt_id: receipt.id });

    return Response.json({
      payment_id: payment.id,
      receipt_id: receipt.id,
      receipt_number: receiptNumber,
      allocations: allocations.map(a => ({ category_name: a.category_name, amount: a.amount }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}