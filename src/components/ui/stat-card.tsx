import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  className?: string;
  onClick?: () => void;
  iconClassName?: string;
}

export function StatCard({ icon: Icon, label, value, trend, className, onClick, iconClassName }: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md animate-scale-in",
        onClick && "cursor-pointer hover:border-primary/40",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl bg-primary/10", iconClassName)}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
        {trend && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
