import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Resolves the authenticated user's active school membership and role.
 * Supports the Global User Identity model — one user can belong to multiple schools.
 *
 * Also handles auto-linking: if a user was onboarded by email (before they registered),
 * their SchoolMembership has no user_id. On first login, we search by email,
 * call the link_account backend function, and then re-fetch with user_id.
 */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!mounted) return;

        // Fetch full user entity — auth.me() only returns fields set via updateMe,
        // not custom fields set via entities.User.update (pin, must_change_password, etc.)
        try {
          const userEntity = await base44.entities.User.get(me.id);
          me.data = {
            ...(me.data || {}),
            pin: userEntity.pin,
            must_change_password: userEntity.must_change_password,
            password_initialized: userEntity.password_initialized,
            password_changed_at: userEntity.password_changed_at
          };
        } catch (_e) {
          // non-fatal — custom fields may not be available
        }

        setUser(me);

        // Find the user's memberships by user_id
        let memberships = [];
        try {
          memberships = await base44.entities.SchoolMembership.filter(
            { user_id: me.id, status: "active" },
            "-is_primary",
            20
          );
        } catch (_e) {
          // membership lookup may fail if entity access is restricted
        }

        // If no memberships found by user_id, try by email (auto-link flow)
        if ((!memberships || memberships.length === 0) && me.email) {
          try {
            const byEmail = await base44.entities.SchoolMembership.filter(
              { user_email: me.email.toLowerCase() },
              "-is_primary",
              50
            );
            if (byEmail && byEmail.length > 0) {
              // Found memberships by email — link the user_id server-side
              try {
                await base44.functions.invoke("manageUserAccount", { action: "link_account" });
                // Re-fetch by user_id (now should have user_id set)
                memberships = await base44.entities.SchoolMembership.filter(
                  { user_id: me.id, status: "active" },
                  "-is_primary",
                  20
                );
              } catch (_linkErr) {
                // Link failed — fall back to email-based memberships
                memberships = byEmail.filter((m) => m.status === "active" || m.status === "invited");
              }
            }
          } catch (_e) {
            // email lookup may fail
          }
        }

        if (memberships && memberships.length > 0) {
          const active = memberships.find((m) => m.is_primary) || memberships[0];
          if (mounted) setMembership(active);

          // Resolve the school (if not super_admin / platform-level)
          if (active.school_id && active.role !== "super_admin") {
            try {
              const sch = await base44.entities.School.get(active.school_id);
              if (mounted) setSchool(sch);
            } catch (_e) {
              // school may not be accessible yet
            }
          }

          // Sync tenancy fields onto the User entity so RLS can enforce isolation.
          const activeSchoolId = active.school_id || "";
          const activeRole = active.role || "user";
          const isSchoolAdmin = ["super_admin", "school_admin"].includes(activeRole);
          const isSuperAdmin = activeRole === "super_admin";

          const current = me.data || {};
          const needsSync =
            current.active_school_id !== activeSchoolId ||
            current.active_role !== activeRole ||
            !!current.is_school_admin !== isSchoolAdmin ||
            !!current.is_super_admin !== isSuperAdmin;

          if (needsSync) {
            try {
              const updated = await base44.auth.updateMe({
                active_school_id: activeSchoolId,
                active_role: activeRole,
                is_school_admin: isSchoolAdmin,
                is_super_admin: isSuperAdmin,
              });
              if (mounted && updated) setUser({ ...me, data: { ...current, ...updated } });
            } catch (_e) {
              // non-fatal: RLS may use stale context until next sync
            }
          }
        }
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const role = membership?.role || user?.data?.active_role || user?.role || "user";
  const schoolId = membership?.school_id || user?.data?.active_school_id || "";

  return { user, membership, school, role, schoolId, loading, error };
}