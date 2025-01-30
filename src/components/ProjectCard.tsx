import { Card, CardContent } from "@/components/ui/card";
import { TaskSummary } from "./TaskSummary";
import { useNavigate } from "react-router-dom";
import { ProjectCardHeader } from "./project/ProjectCardHeader";
import { ProjectMetrics } from "./project/ProjectMetrics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddToCartButton } from "./cart/AddToCartButton";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { LifecycleStatusBadge } from "./project/LifecycleStatusBadge";
import { useUser } from "@supabase/auth-helpers-react";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

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
  onEdit,
  onViewHistory,
  onReview,
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const { userProfile, userRoles, isAdmin } = usePermissionsContext();

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
    queryKey: ["latestReview", id],
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

  const { data: isMember } = useQuery({
    queryKey: ["projectMember", id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) {
        console.error("Missing project ID or user ID for member check");
        return false;
      }

      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking project membership:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!id && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Vérification des rôles
  const isManager = userRoles?.includes("manager");
  const isProjectManager = userProfile?.email === project_manager;

  const canEdit = isAdmin || isManager || isProjectManager;

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in">
      <ProjectCardHeader
        title={title}
        status={latestReview?.weather || null}
        onEdit={onEdit}
        onViewHistory={onViewHistory}
        id={id}
        isMember={isMember}
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
              {isMember && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Membre du projet
                </span>
              )}
            </div>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
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