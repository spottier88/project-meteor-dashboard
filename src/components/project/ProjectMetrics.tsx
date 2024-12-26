import { cn } from "@/lib/utils";
import { ProgressStatus } from "../ProjectCard";

const progressColors = {
  better: "text-success",
  stable: "text-neutral",
  worse: "text-danger",
} as const;

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
} as const;

interface ProjectMetricsProps {
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
}

export const ProjectMetrics = ({
  progress,
  completion,
  lastReviewDate,
}: ProjectMetricsProps) => {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Progression</span>
        <span className={cn("text-sm font-medium", progressColors[progress])}>
          {progressLabels[progress]}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Avancement</span>
        <span className="text-sm font-medium">{completion}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Dernière Revue</span>
        <span className="text-sm font-medium">{lastReviewDate}</span>
      </div>
    </div>
  );
};