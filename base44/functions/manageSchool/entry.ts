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
      case 'create': return await createSchool(base44, user, body);
      case 'update': return await updateSchool(base44, user, body);
      case 'suspend': return await setSchoolStatus(base44, user, body, 'suspended');
      case 'activate': return await setSchoolStatus(base44, user, body, 'active');
      case 'deactivate': return await setSchoolStatus(base44, user, body, 'inactive');
      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function createSchool(base44: any, user: any, body: any) {
  const { name, school_code, short_name, motto, address, city, country, phone, email, website, logo_url, status, plan } = body;
  if (!name || !name.trim()) {
    return Response.json({ error: 'School name is required' }, { status: 400 });
  }

  if (school_code && school_code.trim()) {
    const existing = await base44.asServiceRole.entities.School.filter(
      { school_code: school_code.trim() }, '-created_date', 1
    );
    if (existing && existing.length > 0) {
      return Response.json({ error: 'A school with this code already exists' }, { status: 409 });
    }
  }

  const school = await base44.entities.School.create({
    name: name.trim(),
    school_code: school_code?.trim() || '',
    short_name: short_name?.trim() || '',
    motto: motto?.trim() || '',
    address: address?.trim() || '',
    city: city?.trim() || '',
    country: country?.trim() || '',
    phone: phone?.trim() || '',
    email: email?.trim() || '',
    website: website?.trim() || '',
    logo_url: logo_url?.trim() || '',
    status: status || 'active',
    plan: plan || 'basic',
    onboarded_by_id: user.id
  });

  await createAuditLog(base44, user, {
    action: 'CREATE_SCHOOL',
    entity_type: 'School',
    entity_id: school.id,
    school_id: school.id,
    school_name: school.name,
    description: `Created school "${school.name}"`,
    metadata: { school_code: school.school_code, status: school.status, plan: school.plan }
  });

  return Response.json({ school });
}

async function updateSchool(base44: any, user: any, body: any) {
  const { school_id, name, school_code, short_name, motto, address, city, country, phone, email, website, logo_url, plan } = body;
  if (!school_id) {
    return Response.json({ error: 'School ID is required' }, { status: 400 });
  }

  const school = await base44.entities.School.get(school_id).catch(() => null);
  if (!school) {
    return Response.json({ error: 'School not found' }, { status: 404 });
  }

  if (school_code && school_code.trim() && school_code.trim() !== school.school_code) {
    const existing = await base44.asServiceRole.entities.School.filter(
      { school_code: school_code.trim() }, '-created_date', 5
    );
    if (existing && existing.some(s => s.id !== school_id)) {
      return Response.json({ error: 'A school with this code already exists' }, { status: 409 });
    }
  }

  const updates: any = {};
  if (name !== undefined) updates.name = name.trim();
  if (school_code !== undefined) updates.school_code = school_code.trim();
  if (short_name !== undefined) updates.short_name = short_name.trim();
  if (motto !== undefined) updates.motto = motto.trim();
  if (address !== undefined) updates.address = address.trim();
  if (city !== undefined) updates.city = city.trim();
  if (country !== undefined) updates.country = country.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (email !== undefined) updates.email = email.trim();
  if (website !== undefined) updates.website = website.trim();
  if (logo_url !== undefined) updates.logo_url = logo_url.trim();
  if (plan !== undefined) updates.plan = plan;

  const updated = await base44.entities.School.update(school_id, updates);

  await createAuditLog(base44, user, {
    action: 'UPDATE_SCHOOL',
    entity_type: 'School',
    entity_id: school_id,
    school_id: school_id,
    school_name: school.name,
    description: `Updated school "${school.name}"`,
    metadata: updates
  });

  return Response.json({ school: updated });
}

async function setSchoolStatus(base44: any, user: any, body: any, status: string) {
  const { school_id, reason } = body;
  if (!school_id) {
    return Response.json({ error: 'School ID is required' }, { status: 400 });
  }

  const school = await base44.entities.School.get(school_id).catch(() => null);
  if (!school) {
    return Response.json({ error: 'School not found' }, { status: 404 });
  }

  const updated = await base44.entities.School.update(school_id, { status });

  const actionName = status === 'suspended' ? 'SUSPEND_SCHOOL' :
                     status === 'active' ? 'ACTIVATE_SCHOOL' : 'DEACTIVATE_SCHOOL';
  const verb = status === 'suspended' ? 'Suspended' : status === 'active' ? 'Activated' : 'Deactivated';

  await createAuditLog(base44, user, {
    action: actionName,
    entity_type: 'School',
    entity_id: school_id,
    school_id: school_id,
    school_name: school.name,
    description: `${verb} school "${school.name}"${reason ? ' — ' + reason : ''}`,
    metadata: { previous_status: school.status, new_status: status, reason: reason || '' }
  });

  return Response.json({ school: updated });
}