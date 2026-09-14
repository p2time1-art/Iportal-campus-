import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isPlatformAdmin, createAuditLog } from '../../shared/platformAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isPlatformAdmin(user)) {
      return Response.json({ error: 'Platform admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create': return await createTransaction(base44, user, body);
      case 'verify': return await verifyTransaction(base44, user, body);
      case 'reverse': return await reverseTransaction(base44, user, body);
      case 'fail': return await setTransactionStatus(base44, user, body, 'failed');
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function createTransaction(base44: any, user: any, body: any) {
  const { school_id, subscription_id, amount, currency, payment_method, external_reference, transaction_date, status, notes } = body;
  if (!school_id || !amount || !transaction_date) {
    return Response.json({ error: 'school_id, amount, and transaction_date are required' }, { status: 400 });
  }
  if (Number(amount) <= 0) {
    return Response.json({ error: 'Amount must be positive' }, { status: 400 });
  }

  const school = await base44.entities.School.get(school_id).catch(() => null);
  if (!school) {
    return Response.json({ error: 'School not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const txn = await base44.entities.PlatformTransaction.create({
    school_id,
    school_name: school.name,
    subscription_id: subscription_id || '',
    amount: Number(amount),
    currency: currency || 'NGN',
    payment_method: payment_method || 'bank_transfer',
    external_reference: external_reference || '',
    status: status || 'pending',
    transaction_date,
    notes: notes || ''
  });

  // If created as successful, set verification fields
  if (status === 'successful') {
    await base44.entities.PlatformTransaction.update(txn.id, {
      verified_by_id: user.id,
      verified_by_name: user.full_name || '',
      verified_at: now
    });
  }

  await createAuditLog(base44, user, {
    action: 'RECORD_PLATFORM_PAYMENT',
    entity_type: 'PlatformTransaction',
    entity_id: txn.id,
    school_id,
    school_name: school.name,
    description: `Recorded platform transaction of ${currency || 'NGN'} ${Number(amount).toLocaleString()} for ${school.name}`,
    metadata: { amount: Number(amount), payment_method, status: status || 'pending' }
  });

  return Response.json({ transaction: txn });
}

async function verifyTransaction(base44: any, user: any, body: any) {
  const { transaction_id } = body;
  if (!transaction_id) {
    return Response.json({ error: 'transaction_id is required' }, { status: 400 });
  }

  const txn = await base44.entities.PlatformTransaction.get(transaction_id).catch(() => null);
  if (!txn) {
    return Response.json({ error: 'Transaction not found' }, { status: 404 });
  }
  if (txn.status !== 'pending') {
    return Response.json({ error: 'Only pending transactions can be verified' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updated = await base44.entities.PlatformTransaction.update(transaction_id, {
    status: 'successful',
    verified_by_id: user.id,
    verified_by_name: user.full_name || '',
    verified_at: now
  });

  await createAuditLog(base44, user, {
    action: 'VERIFY_PLATFORM_PAYMENT',
    entity_type: 'PlatformTransaction',
    entity_id: transaction_id,
    school_id: txn.school_id,
    school_name: txn.school_name,
    description: `Verified platform transaction of ${txn.currency} ${Number(txn.amount).toLocaleString()} for ${txn.school_name}`,
    metadata: { amount: txn.amount, previous_status: 'pending', new_status: 'successful' }
  });

  return Response.json({ transaction: updated });
}

async function reverseTransaction(base44: any, user: any, body: any) {
  const { transaction_id, reason } = body;
  if (!transaction_id) {
    return Response.json({ error: 'transaction_id is required' }, { status: 400 });
  }

  const txn = await base44.entities.PlatformTransaction.get(transaction_id).catch(() => null);
  if (!txn) {
    return Response.json({ error: 'Transaction not found' }, { status: 404 });
  }
  if (txn.status !== 'successful') {
    return Response.json({ error: 'Only successful transactions can be reversed' }, { status: 400 });
  }

  const updated = await base44.entities.PlatformTransaction.update(transaction_id, {
    status: 'reversed'
  });

  await createAuditLog(base44, user, {
    action: 'REVERSE_PLATFORM_PAYMENT',
    entity_type: 'PlatformTransaction',
    entity_id: transaction_id,
    school_id: txn.school_id,
    school_name: txn.school_name,
    description: `Reversed platform transaction of ${txn.currency} ${Number(txn.amount).toLocaleString()} for ${txn.school_name}`,
    metadata: { amount: txn.amount, reason: reason || '', previous_status: 'successful', new_status: 'reversed' }
  });

  return Response.json({ transaction: updated });
}

async function setTransactionStatus(base44: any, user: any, body: any, status: string) {
  const { transaction_id } = body;
  if (!transaction_id) {
    return Response.json({ error: 'transaction_id is required' }, { status: 400 });
  }

  const txn = await base44.entities.PlatformTransaction.get(transaction_id).catch(() => null);
  if (!txn) {
    return Response.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const updated = await base44.entities.PlatformTransaction.update(transaction_id, { status });

  await createAuditLog(base44, user, {
    action: 'UPDATE_PLATFORM_TRANSACTION',
    entity_type: 'PlatformTransaction',
    entity_id: transaction_id,
    school_id: txn.school_id,
    school_name: txn.school_name,
    description: `Marked platform transaction as ${status} for ${txn.school_name}`,
    metadata: { previous_status: txn.status, new_status: status }
  });

  return Response.json({ transaction: updated });
}