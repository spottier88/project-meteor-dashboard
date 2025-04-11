
import { Card, CardContent } from "@/components/ui/card";
import { TaskSummary } from "./TaskSummary";
import { useNavigate } from "react-router-dom";
import { ProjectCardHeader } from "./project/ProjectCardHeader";
import { ProjectMetrics } from "./project/ProjectMetrics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  lastReviewDate: string | null;
  id: string;
  project_manager?: string;
  owner_id?: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
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
  lastReviewDate,
  id,
  project_manager,
  owner_id,
  pole_id,
  direction_id,
  service_id,
  lifecycle_status,
  for_entity_type,
  for_entity_id,
  onEdit,
  onViewHistory,
  onReview,
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const { canEdit, isMember, isProjectManager, isAdmin, canManageTeam, isSecondaryProjectManager } = useProjectPermissions(id);

  const { data: organization } = useQuery({
    queryKey: ["organization", pole_id, direction_id, service_id],
    queryFn: async () => {
      let org = { name: "", level: "" };

      if (service_id) {
        const { data } = await supabase
          .from("services")
          .select("name")
          .eq("id", service_id)
          .maybeSingle();
        if (data) {
          org = { name: data.name, level: "Service" };
        }
      } else if (direction_id) {
        const { data } = await supabase
          .from("directions")
          .select("name")
          .eq("id", direction_id)
          .maybeSingle();
        if (data) {
          org = { name: data.name, level: "Direction" };
        }
      } else if (pole_id) {
        const { data } = await supabase
          .from("poles")
          .select("name")
          .eq("id", pole_id)
          .maybeSingle();
        if (data) {
          org = { name: data.name, level: "Pôle" };
        }
      }

      return org;
    },
    enabled: !!(pole_id || direction_id || service_id),
    staleTime: 5 * 60 * 1000,
  });

  const { data: latestReview } = useQuery({
    queryKey: ["projects", id, "latest-review"],
    queryFn: async () => {
      if (!id) {
        console.error("No project ID provided for latest review query");
        return null;
      }

      const { data, error } = await supabase
        .from("latest_reviews")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching latest review:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!id,
  });

  const { data: projectManagerProfile } = useQuery({
    queryKey: ["projectManagerProfile", project_manager],
    queryFn: async () => {
      if (!project_manager) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", project_manager)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project manager profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!project_manager,
  });

  const getProjectManagerDisplay = () => {
    if (!project_manager) return "-";
    if (projectManagerProfile?.first_name && projectManagerProfile?.last_name) {
      return `${projectManagerProfile.first_name} ${projectManagerProfile.last_name}`;
    }
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

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in overflow-hidden flex flex-col relative">
      <div className={cn("h-2 w-full", getStatusColorClass(lifecycle_status))} />
      
      <ProjectCardHeader
        title={title}
        status={latestReview?.weather || null}
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
          {organization?.name && (
            <p className="text-sm text-muted-foreground">
              {organization.level}: {organization.name}
            </p>
          )}
          <div 
            className="cursor-pointer"
            onClick={() => navigate(`/projects/${id}`)}
          >
            <ProjectMetrics
              progress={latestReview?.progress || null}
              completion={latestReview?.completion || 0}
              lastReviewDate={latestReview?.created_at || null}
            />
          </div>
          <TaskSummary projectId={id} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
