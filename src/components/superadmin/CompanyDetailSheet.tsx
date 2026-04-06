import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CompanyDetailSheetProps {
  company: any | null;
  open: boolean;
  onClose: () => void;
}

const statusColor: Record<string, string> = {
  ativa: "default",
  suspensa: "secondary",
  cancelada: "destructive",
};

export function CompanyDetailSheet({ company, open, onClose }: CompanyDetailSheetProps) {
  if (!company) return null;

  const sub = company.subscriptions?.[0];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{company.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={statusColor[company.status] as any || "default"}>{company.status}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Plano</p>
              <p className="font-medium text-foreground">{sub?.plans?.name || "Sem plano"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Usuários ativos</p>
              <p className="font-medium text-foreground">{company.active_users_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Storage</p>
              <p className="font-medium text-foreground">{company.storage_used_mb} MB</p>
            </div>
            <div>
              <p className="text-muted-foreground">Domínio custom</p>
              <p className="font-medium text-foreground">{company.custom_domain || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Trial até</p>
              <p className="font-medium text-foreground">
                {company.trial_until ? format(new Date(company.trial_until), "dd/MM/yyyy") : "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Criado em</p>
              <p className="font-medium text-foreground">{format(new Date(company.created_at), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>
          {sub && (
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-foreground mb-2">Assinatura</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="text-foreground">{sub.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="text-foreground">R$ {Number(sub.plans?.price_monthly || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
