import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/TaskList";
import { ArrowLeft } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "@/types/project";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  last_review_date: string;
  project_manager?: string;
}

const statusLabels = {
  sunny: "Ensoleillé",
  cloudy: "Nuageux",
  stormy: "Orageux",
};

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
};

export const TaskManagement = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const [projectResult, reviewResult] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .maybeSingle(),
        supabase
          .from("latest_reviews")
          .select("*")
          .eq("project_id", projectId)
          .maybeSingle()
      ]);

      if (projectResult.error) throw projectResult.error;

      return {
        ...projectResult.data,
        status: reviewResult.data?.weather || null,
        progress: reviewResult.data?.progress || null,
        completion: reviewResult.data?.completion || 0,
        last_review_date: reviewResult.data?.created_at || null
      } as Project;
    },
  });

  if (!project) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux projets
      </Button>

      <div className="bg-card rounded-lg border p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Chef de projet</span>
            <p className="font-medium">{project.project_manager || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Statut</span>
            <p className="font-medium">{project.status ? statusLabels[project.status] : "Pas de revue"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Progression</span>
            <p className="font-medium">{project.progress ? progressLabels[project.progress] : "Pas de revue"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Avancement</span>
            <p className="font-medium">{project.completion || 0}%</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Dernière revue</span>
            <p className="font-medium">
              {project.last_review_date ? new Date(project.last_review_date).toLocaleDateString("fr-FR") : "Pas de revue"}
            </p>
          </div>
        </div>
      </div>

      <TaskList projectId={projectId || ""} />
    </div>
  );
};