import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ title, value, icon: Icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );
}
