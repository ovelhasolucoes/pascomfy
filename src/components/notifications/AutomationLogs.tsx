import { useState } from "react";
import { useAutomationLogs } from "@/hooks/useAutomationLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, MessageSquare, Smartphone, Mail, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  in_app: Bell, push: Smartphone, whatsapp: MessageSquare, email: Mail,
};
const CHANNEL_LABELS: Record<string, string> = {
  in_app: "In-App", push: "Push", whatsapp: "WhatsApp", email: "Email",
};

export function AutomationLogs() {
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { logs, loading } = useAutomationLogs({
    channel: channelFilter !== "all" ? channelFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Stats
  const totalSent = logs.filter((l) => l.status === "enviado").length;
  const totalError = logs.filter((l) => l.status === "erro").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><BarChart3 className="h-4 w-4 text-muted-foreground" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalSent}</p>
              <p className="text-xs text-muted-foreground">Enviados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><XCircle className="h-4 w-4 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalError}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Histórico</CardTitle>
            <div className="flex gap-2">
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum log encontrado.</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Canal</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const ChannelIcon = CHANNEL_ICONS[log.channel] || Bell;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs gap-1">
                            <ChannelIcon className="h-3 w-3" />{CHANNEL_LABELS[log.channel] || log.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.status === "enviado" ? (
                            <Badge className="text-xs gap-1 bg-primary/10 text-primary border-0">
                              <CheckCircle2 className="h-3 w-3" />Enviado
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <XCircle className="h-3 w-3" />Erro
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs max-w-[280px] truncate text-muted-foreground">{log.message}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
