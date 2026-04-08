import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlatformBrandingContext } from "@/contexts/PlatformBrandingContext";
import { ArrowLeft, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { branding, login } = usePlatformBrandingContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message || "Verifique suas credenciais.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ variant: "destructive", title: "Informe seu e-mail" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível enviar o e-mail.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const bgStyle = login.background_url
    ? { backgroundImage: `url(${login.background_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4"
      style={bgStyle}
    >
      {login.background_url && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      )}
      <div className="relative w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt={branding.app_name}
              className="h-14 w-14 rounded-2xl object-contain mx-auto shadow-sm"
            />
          ) : (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-sm">
              {branding.app_name.charAt(0)}
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {branding.app_name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {forgotMode
              ? "Recuperar senha"
              : login.welcome_subtitle || login.welcome_title}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
          {forgotMode ? (
            resetSent ? (
              <div className="text-center space-y-4 py-4">
                <p className="font-medium text-foreground">E-mail enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                </p>
                <Button variant="outline" onClick={() => { setForgotMode(false); setResetSent(false); }} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Enviar link
                </Button>
                <Button type="button" variant="ghost" className="w-full gap-2" onClick={() => setForgotMode(false)}>
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">
                    Esqueci a senha
                  </button>
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          )}
        </div>

        {!forgotMode && (
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary underline font-medium">Cadastre-se</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
