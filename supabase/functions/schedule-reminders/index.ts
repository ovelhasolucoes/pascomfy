import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find events starting in the next 24h that are active
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, company_id, start_date")
      .eq("status", "ativo")
      .gte("start_date", now.toISOString())
      .lte("start_date", in24h.toISOString());

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reminders_sent: 0, reason: "no_upcoming_events" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSent = 0;

    for (const event of events) {
      // Get all team members for this event
      const { data: members, error: membersError } = await supabase
        .from("event_team_members")
        .select("user_id, event_team_id")
        .eq("company_id", event.company_id)
        .in("status", ["pendente", "confirmado"])
        .in(
          "event_team_id",
          (
            await supabase
              .from("event_teams")
              .select("id")
              .eq("event_id", event.id)
          ).data?.map((t: { id: string }) => t.id) || []
        );

      if (membersError || !members || members.length === 0) continue;

      const userIds = [...new Set(members.map((m) => m.user_id))];

      // Check which users already received a reminder for this event
      const { data: existing } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("company_id", event.company_id)
        .eq("type", "evento")
        .in("user_id", userIds)
        .contains("metadata", { event_id: event.id, reminder_24h: true });

      const alreadyNotified = new Set(existing?.map((n) => n.user_id) || []);
      const toNotify = userIds.filter((uid) => !alreadyNotified.has(uid));

      if (toNotify.length === 0) continue;

      // Format event date for the message
      const eventDate = new Date(event.start_date);
      const formattedDate = eventDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Insert reminder notifications
      const notifRows = toNotify.map((uid) => ({
        company_id: event.company_id,
        user_id: uid,
        title: "Lembrete: evento amanhã",
        message: `O evento "${event.title}" acontece ${formattedDate}. Confirme sua presença!`,
        type: "evento" as const,
        metadata: { event_id: event.id, reminder_24h: true },
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("notifications")
        .insert(notifRows)
        .select("id");

      if (insertError) {
        console.error(`Error inserting reminders for event ${event.id}:`, insertError);
        continue;
      }

      // Log in-app delivery
      if (inserted) {
        await supabase.from("notification_logs").insert(
          inserted.map((n: { id: string }) => ({
            notification_id: n.id,
            channel: "in_app" as const,
            status: "enviado" as const,
          }))
        );
        totalSent += inserted.length;
      }

      // Trigger push/whatsapp via send-notification for each user
      // (calling the same function to reuse push/whatsapp logic)
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "evento",
            userIds: toNotify,
            companyId: event.company_id,
            title: "Lembrete: evento amanhã",
            message: `O evento "${event.title}" acontece ${formattedDate}. Confirme sua presença!`,
            metadata: { event_id: event.id, reminder_24h: true },
          }),
        });
      } catch (pushErr) {
        console.error(`Error triggering push for event ${event.id}:`, pushErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: totalSent, events_checked: events.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("schedule-reminders error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
