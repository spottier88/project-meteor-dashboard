
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { ProgressStatus } from "@/types/project";
import { cn } from "@/lib/utils";

interface ProjectMetricsProps {
  progress: ProgressStatus | null;
  completion: number;
  lastReviewDate: string | null;
}

export const ProjectMetrics = ({
  progress,
  completion,
  lastReviewDate,
}: ProjectMetricsProps) => {
  const getProgressIcon = (progress: ProgressStatus | null) => {
    if (!progress) return null;

    const iconClasses = "h-4 w-4";
    
    switch (progress) {
      case "better":
        return <ArrowUp className={cn(iconClasses, "text-green-500")} />;
      case "stable":
        return <ArrowRight className={cn(iconClasses, "text-blue-500")} />;
      case "worse":
        return <ArrowDown className={cn(iconClasses, "text-red-500")} />;
      default:
        return null;
    }
  };

  const getProgressColorClass = (percentage: number) => {
    if (percentage < 25) return "bg-red-500";
    if (percentage < 50) return "bg-orange-500";
    if (percentage < 75) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Avancement</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{completion}%</span>
          {getProgressIcon(progress)}
        </div>
      </div>
      
      <Progress 
        value={completion} 
        className="h-2"
        indicatorClassName={getProgressColorClass(completion)}
      />
      
      <div className="text-xs text-muted-foreground">
        Dernière revue : {lastReviewDate ? new Date(lastReviewDate).toLocaleDateString() : "Aucune"}
      </div>
    </div>
  );
};
