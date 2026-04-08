import { useState } from "react";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { TicketThread } from "@/components/superadmin/TicketThread";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

const statusVariant: Record<string, any> = { aberto: "destructive", respondido: "secondary", fechado: "outline" };

const SuperAdminTickets = () => {
  const { data: tickets, isLoading, updateTicketStatus } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? tickets : tickets?.filter((t: any) => t.status === filter);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTicketStatus.mutateAsync({ id, status });
      toast.success("Status atualizado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Tickets de Suporte</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="aberto">Abertos</SelectItem>
              <SelectItem value="respondido">Respondidos</SelectItem>
              <SelectItem value="fechado">Fechados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filtered || []).map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{t.companies?.name}</TableCell>
                    <TableCell>{t.profiles?.name}</TableCell>
                    <TableCell>
                      <Select defaultValue={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
                        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="respondido">Respondido</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{format(new Date(t.created_at), "dd/MM HH:mm")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(t)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(filtered || []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum ticket encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.title}</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedTicket?.description}</p>
          </DialogHeader>
          {selectedTicket && <TicketThread ticketId={selectedTicket.id} />}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminTickets;
