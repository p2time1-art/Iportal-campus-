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
      case 'create': return await createSubscription(base44, user, body);
      case 'update': return await updateSubscription(base44, user, body);
      case 'renew': return await renewSubscription(base44, user, body);
      case 'suspend': return await setSubscriptionStatus(base44, user, body, 'suspended');
      case 'cancel': return await setSubscriptionStatus(base44, user, body, 'cancelled');
      case 'activate': return await setSubscriptionStatus(base44, user, body, 'active');
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function createSubscription(base44: any, user: any, body: any) {
  const { school_id, plan_name, status, start_date, expiry_date, amount, currency, billing_cycle, external_reference, notes } = body;
  if (!school_id || !plan_name) {
    return Response.json({ error: 'school_id and plan_name are required' }, { status: 400 });
  }

  const school = await base44.entities.School.get(school_id).catch(() => null);
  if (!school) {
    return Response.json({ error: 'School not found' }, { status: 404 });
  }

  const subscription = await base44.entities.Subscription.create({
    school_id,
    school_name: school.name,
    plan_name,
    status: status || 'trial',
    start_date: start_date || '',
    expiry_date: expiry_date || '',
    amount: Number(amount) || 0,
    currency: currency || 'NGN',
    billing_cycle: billing_cycle || 'annually',
    external_reference: external_reference || '',
    notes: notes || ''
  });

  await createAuditLog(base44, user, {
    action: 'CREATE_SUBSCRIPTION',
    entity_type: 'Subscription',
    entity_id: subscription.id,
    school_id,
    school_name: school.name,
    description: `Created ${plan_name} subscription for ${school.name}`,
    metadata: { plan_name, status: subscription.status, amount: subscription.amount }
  });

  return Response.json({ subscription });
}

async function updateSubscription(base44: any, user: any, body: any) {
  const { subscription_id, plan_name, start_date, expiry_date, amount, billing_cycle, external_reference, notes } = body;
  if (!subscription_id) {
    return Response.json({ error: 'subscription_id is required' }, { status: 400 });
  }

  const subscription = await base44.entities.Subscription.get(subscription_id).catch(() => null);
  if (!subscription) {
    return Response.json({ error: 'Subscription not found' }, { status: 404 });
  }

  const updates: any = {};
  if (plan_name !== undefined) updates.plan_name = plan_name;
  if (start_date !== undefined) updates.start_date = start_date;
  if (expiry_date !== undefined) updates.expiry_date = expiry_date;
  if (amount !== undefined) updates.amount = Number(amount);
  if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle;
  if (external_reference !== undefined) updates.external_reference = external_reference;
  if (notes !== undefined) updates.notes = notes;

  const updated = await base44.entities.Subscription.update(subscription_id, updates);

  await createAuditLog(base44, user, {
    action: 'UPDATE_SUBSCRIPTION',
    entity_type: 'Subscription',
    entity_id: subscription_id,
    school_id: subscription.school_id,
    school_name: subscription.school_name,
    description: `Updated subscription for ${subscription.school_name}`,
    metadata: updates
  });

  return Response.json({ subscription: updated });
}

async function renewSubscription(base44: any, user: any, body: any) {
  const { subscription_id, new_expiry_date, new_start_date, amount } = body;
  if (!subscription_id || !new_expiry_date) {
    return Response.json({ error: 'subscription_id and new_expiry_date are required' }, { status: 400 });
  }

  const subscription = await base44.entities.Subscription.get(subscription_id).catch(() => null);
  if (!subscription) {
    return Response.json({ error: 'Subscription not found' }, { status: 404 });
  }

  const updates: any = {
    expiry_date: new_expiry_date,
    status: 'active'
  };
  if (new_start_date) updates.start_date = new_start_date;
  if (amount !== undefined) updates.amount = Number(amount);

  const updated = await base44.entities.Subscription.update(subscription_id, updates);

  await createAuditLog(base44, user, {
    action: 'RENEW_SUBSCRIPTION',
    entity_type: 'Subscription',
    entity_id: subscription_id,
    school_id: subscription.school_id,
    school_name: subscription.school_name,
    description: `Renewed subscription for ${subscription.school_name} until ${new_expiry_date}`,
    metadata: { new_expiry_date, previous_expiry: subscription.expiry_date }
  });

  return Response.json({ subscription: updated });
}

async function setSubscriptionStatus(base44: any, user: any, body: any, status: string) {
  const { subscription_id, reason } = body;
  if (!subscription_id) {
    return Response.json({ error: 'subscription_id is required' }, { status: 400 });
  }

  const subscription = await base44.entities.Subscription.get(subscription_id).catch(() => null);
  if (!subscription) {
    return Response.json({ error: 'Subscription not found' }, { status: 404 });
  }

  const updated = await base44.entities.Subscription.update(subscription_id, { status });

  const actionName = status === 'suspended' ? 'SUSPEND_SUBSCRIPTION' :
                     status === 'cancelled' ? 'CANCEL_SUBSCRIPTION' : 'ACTIVATE_SUBSCRIPTION';

  await createAuditLog(base44, user, {
    action: actionName,
    entity_type: 'Subscription',
    entity_id: subscription_id,
    school_id: subscription.school_id,
    school_name: subscription.school_name,
    description: `${status.charAt(0).toUpperCase() + status.slice(1)} subscription for ${subscription.school_name}`,
    metadata: { previous_status: subscription.status, new_status: status, reason: reason || '' }
  });

  return Response.json({ subscription: updated });
}