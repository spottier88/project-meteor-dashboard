import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudLightning, Pencil, History, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskSummary } from "./TaskSummary";
import { useNavigate } from "react-router-dom";

export type ProjectStatus = "sunny" | "cloudy" | "stormy";
export type ProgressStatus = "better" | "stable" | "worse";

interface ProjectCardProps {
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
  id: string;
  suivi_dgs?: boolean;
  onReview: (id: string, title: string) => void;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
}

const statusIcons = {
  sunny: { icon: Sun, color: "text-warning", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-neutral", label: "Nuageux" },
  stormy: { icon: CloudLightning, color: "text-danger", label: "Orageux" },
};

const progressColors = {
  better: "text-success",
  stable: "text-neutral",
  worse: "text-danger",
};

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
};

export const ProjectCard = ({
  title,
  status,
  progress,
  completion,
  lastReviewDate,
  id,
  suivi_dgs,
  onReview,
  onEdit,
  onViewHistory,
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const StatusIcon = statusIcons[status].icon;

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
            {suivi_dgs && (
            <Star className="h-4 w-4 text-yellow-500" aria-label="Suivi DGS" />
          )}
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory(id, title);
            }}
            className="h-8 w-8"
          >
            <History className="h-4 w-4" />
          </Button>
          <StatusIcon 
            className={cn("w-6 h-6", statusIcons[status].color)}
            aria-label={statusIcons[status].label}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div 
            className="cursor-pointer"
            onClick={() => navigate(`/projects/${id}`)}
          >
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
          </div>
          <TaskSummary projectId={id} />
        </div>
      </CardContent>
    </Card>
  );
};
