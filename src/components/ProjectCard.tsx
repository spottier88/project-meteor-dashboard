import { Card, CardContent } from "@/components/ui/card";
import { TaskSummary } from "./TaskSummary";
import { useNavigate } from "react-router-dom";
import { ProjectCardHeader } from "./project/ProjectCardHeader";
import { ProjectMetrics } from "./project/ProjectMetrics";

export type ProjectStatus = "sunny" | "cloudy" | "stormy";
export type ProgressStatus = "better" | "stable" | "worse";

interface ProjectCardProps {
  title: string;
  description?: string;
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

export const ProjectCard = ({
  title,
  description,
  status,
  progress,
  completion,
  lastReviewDate,
  id,
  suivi_dgs,
  onEdit,
  onViewHistory,
}: ProjectCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in">
      <ProjectCardHeader
        title={title}
        status={status}
        suivi_dgs={suivi_dgs}
        onEdit={onEdit}
        onViewHistory={onViewHistory}
        id={id}
      />
      <CardContent>
        <div className="grid gap-4">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <div 
            className="cursor-pointer"
            onClick={() => navigate(`/projects/${id}`)}
          >
            <ProjectMetrics
              progress={progress}
              completion={completion}
              lastReviewDate={lastReviewDate}
            />
          </div>
          <TaskSummary projectId={id} />
        </div>
      </CardContent>
    </Card>
  );
};