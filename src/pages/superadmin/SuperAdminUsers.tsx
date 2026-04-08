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
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, profiles(id, name, email, created_at, status)")
        .eq("role", "super_admin");
      if (error) throw error;
      return data || [];
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
                    <TableCell className="font-medium">{u.profiles?.name}</TableCell>
                    <TableCell>{u.profiles?.email}</TableCell>
                    <TableCell><Badge>super_admin</Badge></TableCell>
                    <TableCell>{u.profiles?.status}</TableCell>
                    <TableCell>
                      {u.profiles?.created_at
                        ? format(new Date(u.profiles.created_at), "dd/MM/yyyy")
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
