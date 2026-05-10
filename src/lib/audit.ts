import { db } from '@/lib/db'

type AuditAction =
  | 'login'
  | 'login_failed'
  | 'create_code'
  | 'redeem_code'
  | 'delete_code'
  | 'draw'
  | 'update_broadcast'
  | 'delete_broadcast'
  | 'change_password'
  | 'setup_admin'

export async function logAudit({
  adminId,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
}: {
  adminId?: string | null
  action: AuditAction | string
  resource?: string | null
  resourceId?: string | null
  details?: Record<string, unknown> | null
  ipAddress?: string | null
}) {
  try {
    await db.auditLog.create({
      data: {
        adminId: adminId || null,
        action,
        resource: resource || null,
        resourceId: resourceId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
      },
    })
  } catch {
    // Audit logging should never fail the main operation
    console.error('Failed to write audit log')
  }
}
