import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTicketMessages } from "@/hooks/useSupportTickets";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Send } from "lucide-react";

interface TicketThreadProps {
  ticketId: string;
}

export function TicketThread({ ticketId }: TicketThreadProps) {
  const { user } = useAuth();
  const { data: messages, isLoading, sendMessage } = useTicketMessages(ticketId);
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || !user) return;
    sendMessage.mutate({ message: text.trim(), userId: user.id });
    setText("");
  };

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3 p-1">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {messages?.map((m: any) => (
            <div key={m.id} className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{m.profiles?.name || "Usuário"}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(m.created_at), "dd/MM HH:mm")}</span>
              </div>
              <p className="text-sm text-foreground">{m.message}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2 mt-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Responder..."
          className="min-h-[60px]"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <Button size="icon" onClick={handleSend} disabled={!text.trim() || sendMessage.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
