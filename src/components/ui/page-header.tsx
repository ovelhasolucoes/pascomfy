import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 animate-fade-in", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground break-words">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
