import { cn } from "@/lib/utils";
import { ProgressStatus } from "@/types/project";

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
  progress: ProgressStatus | null;
  completion: number;
  lastReviewDate: string | null;
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
        {progress ? (
          <span className={cn("text-sm font-medium", progressColors[progress])}>
            {progressLabels[progress]}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Pas de revue</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Avancement</span>
        <span className="text-sm font-medium">{completion}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Dernière Revue</span>
        {lastReviewDate ? (
          <span className="text-sm font-medium">
            {new Date(lastReviewDate).toLocaleDateString("fr-FR")}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Pas de revue</span>
        )}
      </div>
    </div>
  );
};
