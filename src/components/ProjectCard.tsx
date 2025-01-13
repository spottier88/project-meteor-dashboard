import { Card, CardContent } from "@/components/ui/card";
import { TaskSummary } from "./TaskSummary";
import { useNavigate } from "react-router-dom";
import { ProjectCardHeader } from "./project/ProjectCardHeader";
import { ProjectMetrics } from "./project/ProjectMetrics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddToCartButton } from "./cart/AddToCartButton";

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
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
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
  pole_id,
  direction_id,
  service_id,
  onEdit,
  onViewHistory,
  onReview,
}: ProjectCardProps) => {
  const navigate = useNavigate();

  const { data: organization } = useQuery({
    queryKey: ["organization", pole_id, direction_id, service_id],
    queryFn: async () => {
      let org = { name: "", level: "" };

      if (service_id) {
        const { data } = await supabase
          .from("services")
          .select("name")
          .eq("id", service_id)
          .single();
        if (data) {
          org = { name: data.name, level: "Service" };
        }
      } else if (direction_id) {
        const { data } = await supabase
          .from("directions")
          .select("name")
          .eq("id", direction_id)
          .single();
        if (data) {
          org = { name: data.name, level: "Direction" };
        }
      } else if (pole_id) {
        const { data } = await supabase
          .from("poles")
          .select("name")
          .eq("id", pole_id)
          .single();
        if (data) {
          org = { name: data.name, level: "Pôle" };
        }
      }

      return org;
    },
    enabled: !!(pole_id || direction_id || service_id),
  });

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg animate-fade-in">
      <ProjectCardHeader
        title={title}
        status={status}
        suivi_dgs={suivi_dgs}
        onEdit={onEdit}
        onViewHistory={onViewHistory}
        onReview={onReview}
        id={id}
        owner_id={owner_id}
        project_manager={project_manager}
        additionalActions={
          <AddToCartButton projectId={id} projectTitle={title} />
        }
      />
      <CardContent>
        <div className="grid gap-4">
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