/**
 * Shared platform-level authorization and audit logging utilities.
 * Used by all platform management backend functions.
 */

export function isPlatformAdmin(user: any): boolean {
  return !!(user?.data?.is_super_admin || user?.role === 'admin');
}

export async function assertPlatformAdmin(base44: any, user: any): Promise<Response | null> {
  if (!isPlatformAdmin(user)) {
    return Response.json({ error: 'Platform admin access required' }, { status: 403 });
  }
  return null;
}

export async function createAuditLog(base44: any, user: any, entry: {
  action: string;
  entity_type?: string;
  entity_id?: string;
  school_id?: string;
  school_name?: string;
  description?: string;
  metadata?: any;
}): Promise<void> {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      actor_user_id: user.id,
      actor_name: user.full_name || user.email || '',
      actor_role: user.data?.active_role || user.role || '',
      school_id: entry.school_id || '',
      school_name: entry.school_name || '',
      action: entry.action,
      entity_type: entry.entity_type || '',
      entity_id: entry.entity_id || '',
      description: entry.description || '',
      metadata: entry.metadata || {}
    });
  } catch (_e) {
    // non-fatal — audit log failure must not block the operation
  }
}