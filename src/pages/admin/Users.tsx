import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogTrigger as DialogTrigger,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/ui/responsive-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useNavigate } from "react-router-dom";
import { UserPlus, Shield, Ban, CheckCircle, Mail, Phone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  roles: AppRole[];
}

const Users = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, loading: permLoading } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("colaborador");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email, phone, status, created_at");

    if (!profiles) {
      setLoading(false);
      return;
    }

    const userIds = profiles.map((p) => p.id);
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const rolesMap = new Map<string, AppRole[]>();
    (allRoles || []).forEach((r) => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    });

    setUsers(
      profiles.map((p) => ({
        ...p,
        status: p.status as string,
        roles: rolesMap.get(p.id) || [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  if (permLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: `Usuário ${newStatus === "ativo" ? "ativado" : "desativado"}` });
      fetchUsers();
    }
  };

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Role atualizada" });
      fetchUsers();
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setSending(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user!.id)
      .single();

    if (!profile) {
      toast({ variant: "destructive", title: "Erro", description: "Perfil não encontrado" });
      setSending(false);
      return;
    }

    const { error } = await supabase.from("invites").insert({
      email: inviteEmail,
      company_id: profile.company_id,
      role: inviteRole,
      created_by: user!.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao enviar convite", description: error.message });
    } else {
      toast({ title: "Convite criado com sucesso!" });
      setInviteEmail("");
      setInviteOpen(false);
    }
    setSending(false);
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ativo: "default",
      inativo: "secondary",
      bloqueado: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-4">
        <PageHeader title="Gestão de Usuários">
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    placeholder="usuario@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={sending} className="w-full">
                  {sending ? "Enviando..." : "Enviar Convite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {loading ? (
          <p className="text-muted-foreground text-center py-10">Carregando...</p>
        ) : isMobile ? (
          /* Mobile: Card list */
          <div className="space-y-3 stagger-fade">
            {users.map((u) => (
              <Card key={u.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{u.name}</p>
                        {statusBadge(u.status)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Select
                      value={u.roles[0] || "colaborador"}
                      onValueChange={(v) => handleChangeRole(u.id, v as AppRole)}
                      disabled={u.id === user?.id}
                    >
                      <SelectTrigger className="flex-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                    {u.id !== user?.id && (
                      <Button
                        variant={u.status === "ativo" ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className="shrink-0"
                      >
                        {u.status === "ativo" ? (
                          <Ban className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Desktop: Table */
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{statusBadge(u.status)}</TableCell>
                      <TableCell>
                        <Select
                          value={u.roles[0] || "colaborador"}
                          onValueChange={(v) => handleChangeRole(u.id, v as AppRole)}
                          disabled={u.id === user?.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="colaborador">Colaborador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(u.id, u.status)}
                          >
                            {u.status === "ativo" ? (
                              <Ban className="mr-1 h-4 w-4" />
                            ) : (
                              <CheckCircle className="mr-1 h-4 w-4" />
                            )}
                            {u.status === "ativo" ? "Desativar" : "Ativar"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Users;
