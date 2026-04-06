import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CreditCard, QrCode } from "lucide-react";

const CheckoutPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gateway, setGateway] = useState<"asaas" | "mercadopago">("asaas");
  const [loading, setLoading] = useState(false);

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!planId,
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, companies(id, name)")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const processPayment = useMutation({
    mutationFn: async () => {
      if (!subscription || !plan || !profile?.company_id) {
        throw new Error("Dados incompletos");
      }

      if (gateway === "asaas") {
        // First create customer if needed
        if (!subscription.asaas_customer_id) {
          await supabase.functions.invoke("asaas-billing", {
            body: {
              action: "create_customer",
              company_id: profile.company_id,
              name: (profile as any).companies?.name || profile.name,
              email: profile.email,
              cpfCnpj: "",
            },
          });
        }

        // Get updated subscription
        const { data: updatedSub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", subscription.id)
          .single();

        const { data, error } = await supabase.functions.invoke("asaas-billing", {
          body: {
            action: "create_charge",
            subscription_id: subscription.id,
            asaas_customer_id: updatedSub?.asaas_customer_id,
            amount: plan.price_monthly,
            billing_type: "PIX",
            description: `Plano ${plan.name} - Pascomfy`,
          },
        });
        if (error) throw error;
        return { gateway: "asaas", ...data };
      } else {
        const appUrl = window.location.origin;
        const { data, error } = await supabase.functions.invoke("mercadopago-billing", {
          body: {
            action: "create_preference",
            subscription_id: subscription.id,
            company_id: profile.company_id,
            amount: plan.price_monthly,
            plan_name: `Plano ${plan.name} - Pascomfy`,
            success_url: `${appUrl}/my-subscription?status=success`,
            failure_url: `${appUrl}/my-subscription?status=failure`,
            pending_url: `${appUrl}/my-subscription?status=pending`,
          },
        });
        if (error) throw error;
        return { gateway: "mercadopago", ...data };
      }
    },
    onSuccess: (data) => {
      if (data.gateway === "mercadopago" && data.init_point) {
        window.open(data.init_point, "_blank");
        toast.success("Redirecionando para o Mercado Pago...");
      } else if (data.gateway === "asaas") {
        toast.success("Cobrança gerada! Verifique o PIX ou boleto.");
      }
      navigate("/my-subscription");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao processar pagamento");
    },
  });

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await processPayment.mutateAsync();
    } finally {
      setLoading(false);
    }
  };

  if (planLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!plan) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Plano não encontrado</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

        <Card>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              R$ {Number(plan.price_monthly).toFixed(2).replace(".", ",")}
              <span className="text-base font-normal text-muted-foreground">/mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={gateway}
              onValueChange={(v) => setGateway(v as "asaas" | "mercadopago")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="asaas" id="asaas" />
                <Label htmlFor="asaas" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">PIX / Boleto (Asaas)</p>
                      <p className="text-sm text-muted-foreground">Pagamento via PIX ou boleto bancário</p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="mercadopago" id="mercadopago" />
                <Label htmlFor="mercadopago" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Mercado Pago</p>
                      <p className="text-sm text-muted-foreground">Cartão, PIX ou boleto via Mercado Pago</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleCheckout}
          disabled={loading || !subscription}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
          ) : (
            `Pagar R$ ${Number(plan.price_monthly).toFixed(2).replace(".", ",")}`
          )}
        </Button>

        {!subscription && profile?.company_id && (
          <p className="text-sm text-destructive text-center">
            Nenhuma assinatura encontrada. Contate o administrador.
          </p>
        )}
      </div>
    </AppLayout>
  );
};

export default CheckoutPage;
