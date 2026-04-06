import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-3xl font-bold text-foreground">Pascomfy</h1>
      <p className="text-muted-foreground">
        Bem-vindo, {user?.email}
      </p>
      <Button variant="outline" onClick={signOut}>
        Sair
      </Button>
    </div>
  );
};

export default Index;
