import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function generateApplicationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `JOB-${timestamp}-${random}`;
}

function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '');
}

function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = sanitizePhone(phone);
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
      vacancy_id,
      full_name,
      email,
      phone,
      cover_letter,
      resume_url,
      resume_name,
      qualifications,
      experience
    } = body;

    if (!vacancy_id || !full_name || !email) {
      return Response.json({ error: 'Vacancy, full name, and email are required.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (phone && !isValidPhone(phone)) {
      return Response.json({ error: 'Phone number must contain digits only (11 digits).' }, { status: 400 });
    }

    // Validate vacancy exists and is open
    const vacancy = await base44.asServiceRole.entities.JobVacancy.get(vacancy_id).catch(() => null);
    if (!vacancy || vacancy.status !== 'open') {
      return Response.json({ error: 'This position is no longer accepting applications.' }, { status: 400 });
    }

    // Check closing date if set
    if (vacancy.closing_date) {
      const closing = new Date(vacancy.closing_date);
      const now = new Date();
      if (closing < now && closing.toDateString() !== now.toDateString()) {
        return Response.json({ error: 'The application deadline for this position has passed.' }, { status: 400 });
      }
    }

    // Generate unique application number
    let applicationNumber = generateApplicationNumber();
    let collisionCheck = await base44.asServiceRole.entities.JobApplication.filter(
      { application_number: applicationNumber },
      '-created_date',
      5
    );
    let attempts = 0;
    while (collisionCheck && collisionCheck.length > 0 && attempts < 10) {
      applicationNumber = generateApplicationNumber();
      collisionCheck = await base44.asServiceRole.entities.JobApplication.filter(
        { application_number: applicationNumber },
        '-created_date',
        5
      );
      attempts++;
    }

    const now = new Date().toISOString();

    const application = await base44.asServiceRole.entities.JobApplication.create({
      school_id: vacancy.school_id,
      school_name: vacancy.school_name || '',
      vacancy_id,
      vacancy_title: vacancy.title,
      application_number: applicationNumber,
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      phone: sanitizePhone(phone || ''),
      cover_letter: cover_letter || '',
      resume_url: resume_url || '',
      resume_name: resume_name || '',
      qualifications: qualifications || '',
      experience: experience || '',
      status: 'submitted',
      submitted_at: now
    });

    return Response.json({
      application_id: application.id,
      application_number: applicationNumber,
      status: 'submitted',
      message: 'Your application has been submitted successfully. Please save your application number for future reference.'
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Application submission failed' }, { status: 500 });
  }
}