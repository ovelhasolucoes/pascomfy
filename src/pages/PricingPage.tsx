import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate(`/login?redirect=/checkout/${planId}`);
      return;
    }
    navigate(`/checkout/${planId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Planos Pascomfy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para a sua paróquia. Todos incluem trial gratuito.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Carregando planos...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(plans || []).map((plan, idx) => {
              const isPopular = idx === 1;
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg scale-[1.02]" : ""}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3">
                      <Sparkles className="h-3 w-3 mr-1" /> Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description || "Gerencie sua paróquia com facilidade"}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        R$ {Number(plan.price_monthly).toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <ul className="space-y-2.5 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        Até {plan.max_users} usuários
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {plan.max_storage_mb} MB de armazenamento
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        Até {plan.max_uploads} uploads
                      </li>
                      {plan.allows_custom_domain && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          Domínio personalizado
                        </li>
                      )}
                      {plan.allows_whitelabel && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          White-label
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {user ? "Assinar" : "Começar agora"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {!user && (
          <p className="text-center text-muted-foreground text-sm mt-8">
            Já tem conta?{" "}
            <a href="/login" className="text-primary underline">Faça login</a>
          </p>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
