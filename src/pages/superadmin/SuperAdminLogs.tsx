import { useQuery } from "@tanstack/react-query";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const SuperAdminLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["superadmin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Logs Globais</h1>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs || []).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">{format(new Date(l.created_at), "dd/MM/yyyy HH:mm:ss")}</TableCell>
                    <TableCell className="font-medium">{l.action}</TableCell>
                    <TableCell>{l.entity}{l.entity_id ? ` (${l.entity_id.substring(0, 8)}...)` : ""}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.ip_address || "—"}</TableCell>
                  </TableRow>
                ))}
                {(logs || []).length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum log registrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SuperAdminLogs;
