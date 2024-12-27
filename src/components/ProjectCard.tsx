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
  status: ProjectStatus | null;
  progress: ProgressStatus | null;
  completion: number;
  lastReviewDate: string | null;
  id: string;
  suivi_dgs?: boolean;
  project_manager?: string;
  owner_id?: string;
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
  project_manager,
  owner_id,
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
        owner_id={owner_id}
        project_manager={project_manager}
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