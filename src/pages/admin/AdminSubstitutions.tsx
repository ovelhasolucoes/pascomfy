import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, Check, X, UserPlus, Loader2 } from "lucide-react";
import { useSubstitutions } from "@/hooks/useSubstitutions";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

const AdminSubstitutions = () => {
  const { companySubstitutions, respondSubstitution } = useSubstitutions();
  const { members } = useCompanyMembers();
  const [filter, setFilter] = useState("pendente");
  const [replaceDialog, setReplaceDialog] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");

  const filtered = companySubstitutions.filter((s: any) =>
    filter === "todos" ? true : s.status === filter
  );

  const handleApprove = async (id: string) => {
    try {
      await respondSubstitution.mutateAsync({ id, status: "aprovado" });
      toast.success("Substituição aprovada!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await respondSubstitution.mutateAsync({ id, status: "rejeitado" });
      toast.success("Substituição rejeitada.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApproveWithReplacement = async () => {
    if (!replaceDialog || !selectedUser) return;
    try {
      await respondSubstitution.mutateAsync({
        id: replaceDialog,
        status: "aprovado",
        replacementUserId: selectedUser,
      });
      toast.success("Substituição aprovada e substituto definido!");
      setReplaceDialog(null);
      setSelectedUser("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Substituições</h1>
            <p className="text-muted-foreground">Gerencie pedidos de substituição da equipe</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="aprovado">Aprovados</SelectItem>
              <SelectItem value="rejeitado">Rejeitados</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {filter === "pendente" ? "Nenhum pedido pendente" : "Nenhuma substituição encontrada"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((sub: any) => {
              const sc = statusConfig[sub.status] ?? statusConfig.pendente;
              return (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={sub.profiles?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {sub.profiles?.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{sub.profiles?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Evento: <span className="text-foreground">{sub.events?.title}</span>
                          </p>
                          {sub.events?.start_date && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(sub.events.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                          <div className="mt-2 p-2 rounded-md bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Motivo:</span> {sub.reason}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Solicitado em {format(new Date(sub.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        {sub.status === "pendente" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleReject(sub.id)}
                              disabled={respondSubstitution.isPending}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(sub.id)}
                              disabled={respondSubstitution.isPending}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setReplaceDialog(sub.id); setSelectedUser(""); }}
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1" /> Substituto
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!replaceDialog} onOpenChange={() => { setReplaceDialog(null); setSelectedUser(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Substituto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Escolha quem irá substituir o membro:</p>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro..." />
              </SelectTrigger>
              <SelectContent>
                {(members ?? []).map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReplaceDialog(null); setSelectedUser(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleApproveWithReplacement} disabled={!selectedUser || respondSubstitution.isPending}>
              {respondSubstitution.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Aprovar com Substituto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminSubstitutions;
