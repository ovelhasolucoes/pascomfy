import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const CheckinPage = () => {
  const { type, token } = useParams<{ type: string; token: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "outside_window">("loading");
  const [message, setMessage] = useState("");
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    if (!user || !profile || !token || !type) return;

    const processCheckin = async () => {
      try {
        if (type === "event") {
          // Volunteer scans event QR → check themselves in
          const { data: event, error: eventErr } = await supabase
            .from("events")
            .select("id, title, start_date, checkin_window_minutes, company_id")
            .eq("checkin_token", token)
            .single();

          if (eventErr || !event) {
            setStatus("error");
            setMessage("Evento não encontrado ou QR inválido.");
            return;
          }

          setEventName(event.title);

          // Check time window
          const windowMin = event.checkin_window_minutes ?? 60;
          const eventStart = new Date(event.start_date);
          const now = new Date();
          const diffMin = (now.getTime() - eventStart.getTime()) / 60000;

          if (diffMin < -windowMin || diffMin > windowMin * 2) {
            setStatus("outside_window");
            setMessage(`Check-in permitido de ${windowMin} min antes até ${windowMin * 2} min depois do início.`);
            return;
          }

          // Check if already checked in
          const { data: existing } = await supabase
            .from("event_attendance")
            .select("id")
            .eq("event_id", event.id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (existing) {
            setStatus("success");
            setMessage("Presença já registrada anteriormente!");
            return;
          }

          // Register attendance
          const { error: insertErr } = await supabase
            .from("event_attendance")
            .insert({
              event_id: event.id,
              user_id: user.id,
              company_id: event.company_id,
              status: "presente",
              checkin_at: new Date().toISOString(),
            });

          if (insertErr) throw insertErr;

          setStatus("success");
          setMessage("Presença registrada com sucesso!");
          toast.success("Check-in realizado! ✅");

        } else if (type === "user") {
          // Admin scans volunteer QR → need to know which event
          // Redirect to admin scanner page with the volunteer code
          setStatus("error");
          setMessage("Para check-in por QR do voluntário, use o scanner na página do evento.");
        }
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setMessage(err.message || "Erro ao processar check-in.");
      }
    };

    processCheckin();
  }, [user, profile, token, type]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <QrCode className="h-12 w-12 text-primary mx-auto" />
            <p className="text-foreground font-medium">Faça login para registrar presença</p>
            <Button onClick={() => navigate("/login")} className="w-full">Entrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <Card className="overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
                <p className="text-foreground font-medium">Processando check-in...</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Check-in Realizado!</h2>
                {eventName && <Badge variant="secondary" className="text-sm">{eventName}</Badge>}
                <p className="text-muted-foreground">{message}</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Erro no Check-in</h2>
                <p className="text-muted-foreground">{message}</p>
              </>
            )}

            {status === "outside_window" && (
              <>
                <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                  <XCircle className="h-12 w-12 text-warning" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Fora do Horário</h2>
                {eventName && <Badge variant="secondary" className="text-sm">{eventName}</Badge>}
                <p className="text-muted-foreground">{message}</p>
              </>
            )}

            <Button onClick={() => navigate("/")} variant="outline" className="mt-4 w-full">
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CheckinPage;
