import { useState } from "react";
import { useAutomationLogs } from "@/hooks/useAutomationLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AutomationLogs() {
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { logs, loading } = useAutomationLogs({
    channel: channelFilter || undefined,
    status: statusFilter || undefined,
  });

  const channelBadge = (ch: string) => {
    const map: Record<string, string> = { in_app: "In-App", push: "Push", whatsapp: "WhatsApp", email: "Email" };
    return <Badge variant="outline" className="text-xs">{map[ch] || ch}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Logs de Envio</CardTitle>
          <div className="flex gap-2">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum log encontrado.</p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{channelBadge(log.channel)}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "enviado" ? "default" : "destructive"} className="text-xs">
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[300px] truncate">{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
