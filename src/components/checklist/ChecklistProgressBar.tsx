import { Progress } from "@/components/ui/progress";

interface ChecklistProgressBarProps {
  completed: number;
  total: number;
  percentage: number;
}

export const ChecklistProgressBar = ({ completed, total, percentage }: ChecklistProgressBarProps) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{completed} de {total} concluídos</span>
      <span className="font-medium">{percentage}%</span>
    </div>
    <Progress value={percentage} className="h-2" />
  </div>
);
