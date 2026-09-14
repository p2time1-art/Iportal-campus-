import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { encryptCredential, decryptCredential, GATEWAY_ENC_KEY } from '../../shared/paymentsGateway.ts';

/**
 * Super Admin gateway credential management.
 * Actions: get, save, test, enable, disable, remove.
 *
 * Security:
 * - 'get' is allowed for school admins (own school) and super admins — returns safe fields only, never secrets.
 * - All other actions require super admin.
 * - Credentials are encrypted at rest using AES-GCM.
 * - Decrypted secrets are never returned in any response.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, school_id } = body;
    if (!school_id) return Response.json({ error: 'School ID is required' }, { status: 400 });

    const isSuperAdmin = !!(user.data?.is_super_admin || user.role === 'admin');

    // 'get' is allowed for school admins (own school) + super admins
    if (action === 'get') {
      const isSchoolAdmin = !!user.data?.is_school_admin;
      const sameSchool = school_id === (user.data?.active_school_id || '');
      if (!isSuperAdmin && !(isSchoolAdmin && sameSchool)) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }
    } else {
      if (!isSuperAdmin) {
        return Response.json({ error: 'Only Super Admins can manage gateway credentials' }, { status: 403 });
      }
    }

    const db = base44.asServiceRole;

    const findConfig = async () => {
      const configs = await db.entities.PaymentGatewayConfig.filter(
        { school_id, gateway: 'paystack' }, '-created_date', 5
      );
      return (configs && configs.length > 0) ? configs[0] : null;
    };

    const audit = async (logAction, description, metadata = {}) => {
      try {
        const school = await db.entities.School.get(school_id).catch(() => null);
        await db.entities.AuditLog.create({
          actor_user_id: user.id,
          actor_name: user.full_name || user.email,
          actor_role: isSuperAdmin ? 'super_admin' : 'school_admin',
          school_id,
          school_name: school?.name || '',
          action: logAction,
          entity_type: 'PaymentGatewayConfig',
          description,
          metadata
        });
      } catch (_e) { /* non-fatal */ }
    };

    switch (action) {
      case 'get': {
        const config = await findConfig();
        if (!config) return Response.json({ status: 'not_configured' });
        return Response.json({
          status: 'configured',
          gateway: config.gateway,
          enabled: config.enabled,
          environment: config.environment,
          currency: config.currency,
          has_credentials: config.has_credentials || false,
          last_tested_at: config.last_tested_at || null,
          last_test_status: config.last_test_status || null,
          last_test_message: config.last_test_message || null,
          secret_key_configured: !!config.encrypted_secret_key,
          public_key_configured: !!config.encrypted_public_key,
          webhook_secret_configured: !!config.encrypted_webhook_secret,
        });
      }

      case 'save': {
        const { secret_key, public_key, webhook_secret, environment, currency } = body;
        if (!secret_key || !public_key) {
          return Response.json({ error: 'Secret key and public key are required' }, { status: 400 });
        }

        const encSecret = await encryptCredential(secret_key, GATEWAY_ENC_KEY);
        const encPublic = await encryptCredential(public_key, GATEWAY_ENC_KEY);
        const encWebhook = webhook_secret ? await encryptCredential(webhook_secret, GATEWAY_ENC_KEY) : '';

        const existing = await findConfig();
        const updateData = {
          encrypted_secret_key: encSecret,
          encrypted_public_key: encPublic,
          encrypted_webhook_secret: encWebhook,
          has_credentials: true,
          environment: environment || existing?.environment || 'test',
          currency: currency || existing?.currency || 'NGN',
          configured_by_id: user.id,
          configured_by_name: user.full_name || user.email,
        };

        if (existing) {
          await db.entities.PaymentGatewayConfig.update(existing.id, updateData);
        } else {
          const school = await db.entities.School.get(school_id).catch(() => null);
          await db.entities.PaymentGatewayConfig.create({
            school_id,
            school_name: school?.name || '',
            gateway: 'paystack',
            enabled: false,
            ...updateData,
          });
        }

        await audit('PAYMENT_GATEWAY_CONFIGURED', 'Gateway credentials saved', { gateway: 'paystack', environment: environment || 'test' });
        return Response.json({ status: 'success', message: 'Credentials saved successfully' });
      }

      case 'test': {
        const { secret_key } = body;
        let keyToTest = secret_key;

        if (!keyToTest) {
          const config = await findConfig();
          if (!config?.has_credentials || !config.encrypted_secret_key) {
            return Response.json({ status: 'failed', message: 'No credentials configured to test' });
          }
          keyToTest = await decryptCredential(config.encrypted_secret_key, GATEWAY_ENC_KEY);
        }

        try {
          const response = await fetch('https://api.paystack.co/transaction', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${keyToTest}` },
          });

          const now = new Date().toISOString();
          const config = await findConfig();

          if (response.status === 401) {
            if (config) {
              await db.entities.PaymentGatewayConfig.update(config.id, {
                last_tested_at: now, last_test_status: 'failed', last_test_message: 'Invalid API key'
              });
            }
            await audit('PAYMENT_GATEWAY_CONNECTION_TESTED', 'Gateway connection test failed', { result: 'failed' });
            return Response.json({ status: 'failed', message: 'The Paystack credentials could not be verified.' });
          }

          if (config) {
            await db.entities.PaymentGatewayConfig.update(config.id, {
              last_tested_at: now, last_test_status: 'success', last_test_message: 'Connection successful'
            });
          }
          await audit('PAYMENT_GATEWAY_CONNECTION_TESTED', 'Gateway connection test successful', { result: 'success' });
          return Response.json({ status: 'success', message: 'Connection successful. Paystack credentials are valid.' });
        } catch (_e) {
          const config = await findConfig();
          if (config) {
            await db.entities.PaymentGatewayConfig.update(config.id, {
              last_tested_at: new Date().toISOString(), last_test_status: 'failed', last_test_message: 'Connection error'
            });
          }
          return Response.json({ status: 'failed', message: 'The Paystack credentials could not be verified.' });
        }
      }

      case 'enable': {
        const config = await findConfig();
        if (!config) return Response.json({ error: 'Gateway not configured. Add credentials first.' }, { status: 400 });
        if (!config.has_credentials) return Response.json({ error: 'Credentials must be configured before enabling' }, { status: 400 });
        await db.entities.PaymentGatewayConfig.update(config.id, { enabled: true });
        await audit('PAYMENT_GATEWAY_ENABLED', 'Online payments enabled', { gateway: 'paystack' });
        return Response.json({ status: 'success', message: 'Online payments enabled' });
      }

      case 'disable': {
        const config = await findConfig();
        if (config) {
          await db.entities.PaymentGatewayConfig.update(config.id, { enabled: false });
          await audit('PAYMENT_GATEWAY_DISABLED', 'Online payments disabled', { gateway: 'paystack' });
        }
        return Response.json({ status: 'success', message: 'Online payments disabled' });
      }

      case 'remove': {
        const config = await findConfig();
        if (config) {
          await db.entities.PaymentGatewayConfig.update(config.id, {
            encrypted_secret_key: '', encrypted_public_key: '', encrypted_webhook_secret: '',
            has_credentials: false, enabled: false,
          });
          await audit('PAYMENT_GATEWAY_CREDENTIALS_REPLACED', 'Gateway credentials removed', { gateway: 'paystack' });
        }
        return Response.json({ status: 'success', message: 'Credentials removed' });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}