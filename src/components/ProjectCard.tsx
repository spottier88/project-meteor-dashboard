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
import { useCompletePermissions } from "@/hooks/use-complete-permissions";

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
  id,
  project_manager,
  owner_id,
  pole_id,
  direction_id,
  service_id,
  lifecycle_status,
  onEdit,
  onViewHistory,
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const permissions = useCompletePermissions(id);

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
  });

  const { data: latestReview } = useQuery({
    queryKey: ["latestReview", id],
    queryFn: async () => {
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

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in">
      <ProjectCardHeader
        title={title}
        status={latestReview?.weather || null}
        onEdit={permissions.canEditProject ? onEdit : undefined}
        onViewHistory={permissions.canViewReviews ? onViewHistory : undefined}
        id={id}
        owner_id={owner_id}
        project_manager={project_manager}
        additionalActions={
          permissions.canViewProject ? (
            <AddToCartButton projectId={id} projectTitle={title} />
          ) : null
        }
      />
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <LifecycleStatusBadge status={lifecycle_status} />
            <div className="flex gap-2">
              {permissions.isProjectManager && (
                <span className="text-xs bg-blue-800 text-white px-2 py-1 rounded">
                  Chef de projet
                </span>
              )}
              {permissions.isManager && (
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                  Manager
                </span>
              )}
              {permissions.isMember && (
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