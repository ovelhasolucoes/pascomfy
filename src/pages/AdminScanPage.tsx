import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { QRScanner } from "@/components/checkin/QRScanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "@/hooks/useEvents";
import { toast } from "sonner";

const AdminScanPage = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events } = useEvents();
  const event = events.find((e) => e.id === eventId);

  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{ name: string; success: boolean; message: string } | null>(null);
  const [processedCodes, setProcessedCodes] = useState<Set<string>>(new Set());

  const handleScan = useCallback(async (data: string) => {
    // Extract user checkin_code from URL
    const match = data.match(/\/checkin\/user\/([a-f0-9-]+)/i);
    const code = match ? match[1] : null;

    if (!code || !eventId || !event) {
      toast.error("QR inválido");
      return;
    }

    if (processedCodes.has(code)) return;

    setProcessing(true);
    setProcessedCodes((prev) => new Set(prev).add(code));

    try {
      // Find user by checkin_code
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, company_id")
        .eq("checkin_code", code)
        .single();

      if (profileErr || !profile) {
        setLastResult({ name: "Desconhecido", success: false, message: "Voluntário não encontrado." });
        setProcessing(false);
        return;
      }

      // Check if already checked in
      const { data: existing } = await supabase
        .from("event_attendance")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existing) {
        setLastResult({ name: profile.name, success: true, message: "Presença já registrada!" });
        setProcessing(false);
        return;
      }

      // Register attendance
      const { error: insertErr } = await supabase
        .from("event_attendance")
        .insert({
          event_id: eventId,
          user_id: profile.id,
          company_id: profile.company_id,
          status: "presente",
          checkin_at: new Date().toISOString(),
        });

      if (insertErr) throw insertErr;

      setLastResult({ name: profile.name, success: true, message: "Check-in realizado!" });
      toast.success(`${profile.name} — presença registrada!`);
    } catch (err: any) {
      setLastResult({ name: "", success: false, message: err.message });
    } finally {
      setProcessing(false);
      // Allow re-scan after 3s
      setTimeout(() => {
        setProcessedCodes((prev) => {
          const next = new Set(prev);
          next.delete(code!);
          return next;
        });
      }, 3000);
    }
  }, [eventId, event, processedCodes]);

  return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/events/${eventId}`)} className="mb-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao evento
        </Button>

        <PageHeader
          title="Scanner de Presença"
          description={event?.title || "Escaneie o QR dos voluntários"}
          icon={<UserCheck className="h-5 w-5 text-primary" />}
        />

        <QRScanner onScan={handleScan} scanning={processing} />

        {lastResult && (
          <Card className={`border-2 ${lastResult.success ? "border-green-500/30" : "border-destructive/30"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {lastResult.success ? (
                <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{lastResult.name}</p>
                <p className="text-sm text-muted-foreground">{lastResult.message}</p>
              </div>
              {lastResult.success && <Badge variant="default">✓</Badge>}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Total registrado nesta sessão: {processedCodes.size}
        </p>
      </div>
    </AppLayout>
  );
};

export default AdminScanPage;
