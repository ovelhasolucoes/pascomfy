import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const SuperAdminUsers = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["superadmin-sa-users"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "super_admin");
      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, created_at, status")
        .in("id", userIds);
      if (profilesError) throw profilesError;

      return roles.map((r) => ({
        ...r,
        profile: (profiles || []).find((p) => p.id === r.user_id) || null,
      }));
    },
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Usuários Super Admin</h1>
        <p className="text-sm text-muted-foreground">
          Apenas usuários administrativos da plataforma. Usuários das empresas são gerenciados no detalhe de cada empresa.
        </p>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users || []).map((u: any) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.profile?.name}</TableCell>
                    <TableCell>{u.profile?.email}</TableCell>
                    <TableCell><Badge>super_admin</Badge></TableCell>
                    <TableCell>{u.profile?.status}</TableCell>
                    <TableCell>
                      {u.profile?.created_at
                        ? format(new Date(u.profile.created_at), "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {(users || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum super admin encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminUsers;
