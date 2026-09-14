import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getGatewayConfig, verifyPaystackTransaction } from '../../shared/paymentsGateway.ts';

function generateApplicationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${timestamp}-${random}`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { internal_reference } = body;

    if (!internal_reference) {
      return Response.json({ error: 'Payment reference is required.' }, { status: 400 });
    }

    // Find the application by payment reference
    const applications = await base44.asServiceRole.entities.AdmissionApplication.filter(
      { application_fee_payment_id: internal_reference },
      '-created_date',
      5
    );

    if (!applications || applications.length === 0) {
      return Response.json({ error: 'No application found for this payment reference.' }, { status: 404 });
    }

    const application = applications[0];

    // Idempotency: already submitted
    if (application.status === 'submitted' && application.application_number) {
      return Response.json({
        application_number: application.application_number,
        already_finalized: true,
        message: 'Your application has already been submitted.'
      });
    }

    // Verify the payment with Paystack
    const config = await getGatewayConfig(base44, application.school_id);
    if (!config.secretKey) {
      return Response.json({ error: 'Payment verification is unavailable. Please contact the school.' }, { status: 500 });
    }

    const gatewayData = await verifyPaystackTransaction(config.secretKey, internal_reference);

    if (gatewayData.status !== 'success') {
      return Response.json({
        error: `Payment not successful. Gateway status: ${gatewayData.status}. Please try again or contact the school.`
      }, { status: 400 });
    }

    // Verify the amount matches
    const paidAmountKobo = Number(gatewayData.amount) || 0;
    const expectedAmountKobo = Math.round((Number(application.application_fee_amount) || 0) * 100);
    if (paidAmountKobo !== expectedAmountKobo) {
      return Response.json({ error: 'Payment amount mismatch. Please contact the school administrator.' }, { status: 400 });
    }

    // Generate the application number
    let applicationNumber = generateApplicationNumber();
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

    const now = new Date().toISOString();

    // Finalize the application
    await base44.asServiceRole.entities.AdmissionApplication.update(application.id, {
      status: 'submitted',
      application_number: applicationNumber,
      application_fee_paid: true,
      submitted_at: now
    });

    return Response.json({
      application_number: applicationNumber,
      application_id: application.id,
      status: 'submitted',
      message: 'Payment verified! Your application has been submitted successfully.'
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to finalize application' }, { status: 500 });
  }
}