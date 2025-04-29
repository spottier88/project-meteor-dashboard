
import { Card, CardContent } from "@/components/ui/card";
import { TaskSummary } from "./TaskSummary";
import { useNavigate } from "react-router-dom";
import { ProjectCardHeader } from "./project/ProjectCardHeader";
import { ProjectMetrics } from "./project/ProjectMetrics";
import { AddToCartButton } from "./cart/AddToCartButton";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus, ForEntityType } from "@/types/project";
import { LifecycleStatusBadge } from "./project/LifecycleStatusBadge";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  title: string;
  description?: string;
  status: ProjectStatus | null;
  progress: ProgressStatus | null;
  completion: number;
  last_review_date: string | null;
  review_created_at: string | null;
  review_progress: ProgressStatus | null;
  id: string;
  project_manager?: string;
  owner_id?: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
  pole_name?: string;
  direction_name?: string;
  service_name?: string;
  lifecycle_status: ProjectLifecycleStatus;
  for_entity_type?: ForEntityType;
  for_entity_id?: string;
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
  last_review_date,
  review_created_at,
  review_progress,
  id,
  project_manager,
  owner_id,
  pole_id,
  direction_id,
  service_id,
  pole_name,
  direction_name,
  service_name,
  lifecycle_status,
  for_entity_type,
  for_entity_id,
  onEdit,
  onViewHistory,
  onReview,
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const { canEdit, isMember, isProjectManager, isAdmin, canManageTeam, isSecondaryProjectManager } = useProjectPermissions(id);

  const getProjectManagerDisplay = () => {
    if (!project_manager) return "-";
    return project_manager;
  };

  const getStatusColorClass = (status: ProjectLifecycleStatus): string => {
    switch (status) {
      case "study":
        return "bg-gray-500";
      case "validated":
        return "bg-blue-500";
      case "in_progress":
        return "bg-green-500";
      case "completed":
        return "bg-purple-500";
      case "suspended":
        return "bg-orange-500";
      case "abandoned":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  // Utiliser la date issue de la dernière revue en priorité
  const reviewDate = review_created_at || last_review_date;
  // Utiliser le progressStatus issu de la dernière revue en priorité
  const progressStatus = review_progress || progress;

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in overflow-hidden flex flex-col relative">
      <div className={cn("h-2 w-full", getStatusColorClass(lifecycle_status))} />
      
      <ProjectCardHeader
        title={title}
        status={status || null}
        onEdit={onEdit}
        onViewHistory={onViewHistory}
        id={id}
        canEdit={canEdit}
        isMember={isMember}
        canManageTeam={canManageTeam}
        isAdmin={isAdmin}
        additionalActions={
          <AddToCartButton projectId={id} projectTitle={title} />
        }
      />
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <LifecycleStatusBadge status={lifecycle_status} />
            <div className="flex gap-2">
              {isProjectManager && (
                <span className="text-xs bg-blue-800 text-white px-2 py-1 rounded">
                  Chef de projet
                </span>
              )}
              {canEdit && !isProjectManager && (
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                  Manager
                </span>
              )}
              {isSecondaryProjectManager && (
                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                  Chef de projet secondaire
                </span>
              )}
              {isMember && !isProjectManager && !isSecondaryProjectManager && !canEdit && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Membre du projet
                </span>
              )}
            </div>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <div className="text-sm text-muted-foreground">
            Chef de projet : {getProjectManagerDisplay()}
          </div>
          {(pole_name || direction_name || service_name) && (
            <p className="text-sm text-muted-foreground">
              {service_name ? `Service: ${service_name}` : 
               direction_name ? `Direction: ${direction_name}` : 
               pole_name ? `Pôle: ${pole_name}` : ""}
            </p>
          )}
          <div 
            className="cursor-pointer"
            onClick={() => navigate(`/projects/${id}`)}
          >
            <ProjectMetrics
              progress={progressStatus || null}
              completion={completion || 0}
              lastReviewDate={reviewDate || null}
            />
          </div>
          <TaskSummary projectId={id} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
