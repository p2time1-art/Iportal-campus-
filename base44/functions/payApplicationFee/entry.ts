import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  generateInternalReference, getGatewayConfig, assertGatewayReady,
  initializePaystackTransaction
} from '../../shared/paymentsGateway.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { application_id, callback_url } = body;

    if (!application_id) {
      return Response.json({ error: 'Application ID is required.' }, { status: 400 });
    }

    // Fetch the draft application
    const application = await base44.asServiceRole.entities.AdmissionApplication.get(application_id).catch(() => null);
    if (!application) {
      return Response.json({ error: 'Application not found.' }, { status: 404 });
    }

    // Only draft applications with unpaid fees can proceed to payment
    if (application.status !== 'draft') {
      return Response.json({ error: 'This application has already been submitted.' }, { status: 400 });
    }

    if (application.application_fee_paid) {
      return Response.json({ error: 'Application fee has already been paid.' }, { status: 400 });
    }

    const feeAmount = Number(application.application_fee_amount) || 0;
    if (feeAmount <= 0) {
      return Response.json({ error: 'No application fee is required for this application.' }, { status: 400 });
    }

    // Get gateway config for the school
    const config = await getGatewayConfig(base44, application.school_id);
    assertGatewayReady(config);

    // Generate internal reference
    const internalRef = generateInternalReference();

    // Initialize Paystack transaction
    const callbackUrl = callback_url || `https://iportal.base44.app/applications/status?ref=${internalRef}`;

    const paystackData = await initializePaystackTransaction(config.secretKey, {
      email: application.email,
      amount: feeAmount,
      reference: internalRef,
      callback_url: callbackUrl,
      currency: config.currency,
      metadata: {
        application_id: application.id,
        school_id: application.school_id,
        internal_reference: internalRef,
        custom_fields: [
          { display_name: 'Applicant', variable_name: 'applicant', value: application.full_name },
          { display_name: 'Application', variable_name: 'app_ref', value: application.id },
          { display_name: 'Reference', variable_name: 'ref', value: internalRef }
        ]
      }
    });

    // Store the payment reference on the application
    await base44.asServiceRole.entities.AdmissionApplication.update(application.id, {
      application_fee_payment_id: internalRef
    });

    return Response.json({
      authorization_url: paystackData.authorization_url,
      internal_reference: internalRef,
      application_id: application.id,
      amount: feeAmount,
      currency: config.currency
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to initialize application fee payment' }, { status: 500 });
  }
}