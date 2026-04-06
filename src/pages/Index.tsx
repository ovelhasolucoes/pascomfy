import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Shield, LogOut } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  const { roles, isAdmin, isSuperAdmin, permissions } = usePermissions();
  const { profile } = useProfile();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Pascomfy</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground">
              <span className="text-muted-foreground">Nome:</span>{" "}
              {profile?.name || user?.email}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">E-mail:</span> {user?.email}
            </p>
            {profile?.phone && (
              <p className="text-foreground">
                <span className="text-muted-foreground">Telefone:</span> {profile.phone}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Roles:</span>
              {roles.map((role) => (
                <Badge key={role} variant={role === "super_admin" ? "destructive" : role === "admin" ? "default" : "secondary"}>
                  <Shield className="mr-1 h-3 w-3" />
                  {role}
                </Badge>
              ))}
            </div>
            {profile?.status && (
              <p className="text-foreground">
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge variant={profile.status === "ativo" ? "default" : "secondary"}>
                  {profile.status}
                </Badge>
              </p>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Administração</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                Gestão de Usuários
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Permissões Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {isSuperAdmin ? (
                <Badge variant="destructive">Acesso Total (Super Admin)</Badge>
              ) : permissions.length > 0 ? (
                permissions.map((p) => (
                  <Badge key={p} variant="outline">{p.replace(/_/g, " ")}</Badge>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhuma permissão atribuída</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
