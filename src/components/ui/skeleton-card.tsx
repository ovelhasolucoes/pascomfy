import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  hasHeader?: boolean;
}

export function SkeletonCard({ className, lines = 3, hasHeader = true }: SkeletonCardProps) {
  return (
    <Card className={cn("animate-pulse", className)}>
      {hasHeader && (
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </CardContent>
    </Card>
  );
}
