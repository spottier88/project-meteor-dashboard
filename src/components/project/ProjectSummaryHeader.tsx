import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatus, ProgressStatus } from "@/components/ProjectCard";
import { statusIcons } from "@/lib/project-status";

interface ProjectSummaryHeaderProps {
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  project_manager?: string;
  last_review_date: string;
}

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
} as const;

export const ProjectSummaryHeader = ({
  title,
  description,
  status,
  progress,
  completion,
  project_manager,
  last_review_date,
}: ProjectSummaryHeaderProps) => {
  const StatusIcon = statusIcons[status].icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {StatusIcon && (
          <StatusIcon
            className={statusIcons[status].color}
            aria-label={statusIcons[status].label}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Chef de projet</span>
            <p className="font-medium">{project_manager || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Avancement</span>
            <p className="font-medium">{completion}%</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Progression</span>
            <p className="font-medium">{progressLabels[progress]}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Dernière revue</span>
            <p className="font-medium">
              {new Date(last_review_date).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};