import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  className?: string;
  onClick?: () => void;
  iconClassName?: string;
}

export function StatCard({ icon: Icon, label, value, className, onClick, iconClassName }: StatCardProps) {
  return (
    <Card
      className={cn(
        "animate-scale-in",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl bg-primary/10", iconClassName)}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-semibold text-foreground leading-none">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
