import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function generateApplicationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${timestamp}-${random}`;
}

function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '');
}

function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = sanitizePhone(phone);
  // Accept digits only, 7-15 digits (international range)
  return /^\d{7,15}$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      school_id,
      programme,
      class_id,
      first_name,
      surname,
      other_names,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      previous_school,
      previous_qualification,
      guardian_name,
      guardian_phone,
      guardian_email,
      passport,
      birth_certificate,
      other_documents,
      notes
    } = body;

    // ─── Required field validation ───
    if (!school_id || !first_name || !surname || !email) {
      return Response.json({ error: 'School, first name, surname, and email are required.' }, { status: 400 });
    }

    // ─── Email validation ───
    if (!isValidEmail(email)) {
      return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // ─── Phone validation (if provided) ───
    if (phone && !isValidPhone(phone)) {
      return Response.json({ error: 'Phone number must contain digits only (11 digits).' }, { status: 400 });
    }
    if (guardian_phone && !isValidPhone(guardian_phone)) {
      return Response.json({ error: 'Guardian phone number must contain digits only (11 digits).' }, { status: 400 });
    }

    // ─── Validate school exists and is active ───
    const school = await base44.asServiceRole.entities.School.get(school_id).catch(() => null);
    if (!school || school.status !== 'active') {
      return Response.json({ error: 'Selected school is not available.' }, { status: 400 });
    }

    // ─── Validate programme/class belongs to this school ───
    if (class_id) {
      const cls = await base44.asServiceRole.entities.SchoolClass.get(class_id).catch(() => null);
      if (!cls || cls.school_id !== school_id) {
        return Response.json({ error: 'Selected programme/class does not belong to this school.' }, { status: 400 });
      }
    }

    // ─── Build full name from components ───
    const fullName = [first_name, surname, other_names].filter(Boolean).map((s: string) => s.trim()).join(' ');

    // ─── Build structured documents array ───
    const documents: any[] = [];
    if (passport && passport.url) {
      documents.push({ name: 'Passport', file_name: passport.file_name || 'passport', url: passport.url });
    }
    if (birth_certificate && birth_certificate.url) {
      documents.push({ name: 'Birth Certificate', file_name: birth_certificate.file_name || 'birth_certificate', url: birth_certificate.url });
    }
    if (other_documents && Array.isArray(other_documents)) {
      for (const doc of other_documents) {
        if (doc && doc.url) {
          documents.push({ name: doc.name || 'Other Document', file_name: doc.file_name || 'document', url: doc.url });
        }
      }
    }

    // ─── Determine application fee status ───
    const feeEnabled = !!(school.application_fee_enabled && Number(school.application_fee_amount) > 0);
    const feeAmount = feeEnabled ? Number(school.application_fee_amount) : 0;

    const now = new Date().toISOString();

    // ─── If fee enabled: create as DRAFT (no application number yet) ───
    // ─── If fee disabled: create as SUBMITTED with application number ───
    let applicationNumber = '';
    let status = 'submitted';

    if (feeEnabled) {
      status = 'draft';
    } else {
      // Generate unique application number
      applicationNumber = generateApplicationNumber();
      let collisionCheck = await base44.asServiceRole.entities.AdmissionApplication.filter(
        { application_number: applicationNumber },
        '-created_date',
        5
      );
      let attempts = 0;
      while (collisionCheck && collisionCheck.length > 0 && attempts < 10) {
        applicationNumber = generateApplicationNumber();
        collisionCheck = await base44.asServiceRole.entities.AdmissionApplication.filter(
          { application_number: applicationNumber },
          '-created_date',
          5
        );
        attempts++;
      }
    }

    const application = await base44.asServiceRole.entities.AdmissionApplication.create({
      school_id,
      school_name: school.name,
      application_number: applicationNumber,
      programme: programme || (class_id ? '' : ''),
      full_name: fullName,
      email: email.toLowerCase().trim(),
      phone: sanitizePhone(phone || ''),
      date_of_birth: date_of_birth || '',
      gender: gender || '',
      address: address || '',
      previous_school: previous_school || '',
      previous_qualification: previous_qualification || '',
      guardian_name: guardian_name || '',
      guardian_phone: sanitizePhone(guardian_phone || ''),
      guardian_email: (guardian_email || '').toLowerCase().trim(),
      documents,
      application_fee_amount: feeAmount,
      application_fee_paid: !feeEnabled,
      application_fee_payment_id: '',
      status,
      submitted_at: feeEnabled ? '' : now,
      notes: notes || ''
    });

    if (feeEnabled) {
      return Response.json({
        application_id: application.id,
        requires_payment: true,
        application_fee_amount: feeAmount,
        currency: 'NGN',
        message: 'Application saved. Please proceed to pay the application fee to complete your submission.'
      });
    }

    return Response.json({
      application_id: application.id,
      application_number: applicationNumber,
      requires_payment: false,
      status: 'submitted',
      message: 'Your application has been submitted successfully. Please save your application number for future reference.'
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Application submission failed' }, { status: 500 });
  }
}