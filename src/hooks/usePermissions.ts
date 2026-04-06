import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface PermissionsState {
  roles: AppRole[];
  permissions: string[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const usePermissions = (): PermissionsState => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        // Fetch user roles
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const fetchedRoles = (userRoles || []).map((r) => r.role);
        setRoles(fetchedRoles);

        // Fetch permissions from role_permissions
        const { data: rolePerms } = await supabase
          .from("role_permissions")
          .select("permission_id, permissions(name)")
          .in("role", fetchedRoles);

        const rolePermNames = (rolePerms || []).map(
          (rp: any) => rp.permissions?.name
        ).filter(Boolean);

        // Fetch user-specific overrides
        const { data: userPerms } = await supabase
          .from("user_permissions")
          .select("allowed, permissions(name)")
          .eq("user_id", user.id);

        const overrides = new Map<string, boolean>();
        (userPerms || []).forEach((up: any) => {
          if (up.permissions?.name) {
            overrides.set(up.permissions.name, up.allowed);
          }
        });

        // Merge: start with role perms, apply overrides
        const finalPerms = new Set<string>();
        rolePermNames.forEach((name: string) => {
          const override = overrides.get(name);
          if (override !== false) finalPerms.add(name);
        });
        // Add explicitly allowed overrides not in role perms
        overrides.forEach((allowed, name) => {
          if (allowed) finalPerms.add(name);
        });

        setPermissions(Array.from(finalPerms));
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const isSuperAdmin = roles.includes("super_admin");

  return {
    roles,
    permissions,
    loading,
    hasRole: (role: AppRole) => roles.includes(role),
    hasPermission: (permission: string) =>
      isSuperAdmin || permissions.includes(permission),
    isAdmin: roles.includes("admin") || isSuperAdmin,
    isSuperAdmin,
  };
};
