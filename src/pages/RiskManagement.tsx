import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RiskList } from "@/components/RiskList";
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { Project } from "@/types/user";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useToast } from "@/components/ui/use-toast";

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

export const RiskManagement = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit, isProjectManager, isAdmin } = useProjectPermissions(projectId || "");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) {
        navigate("/");
        return null;
      }

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

      if (projectResult.error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger le projet",
        });
        throw projectResult.error;
      }

      if (!projectResult.data) {
        toast({
          variant: "destructive",
          title: "Projet non trouvé",
          description: "Le projet demandé n'existe pas",
        });
        navigate("/");
        return null;
      }

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

      <RiskList 
        projectId={projectId || ""} 
        projectTitle={project.title}
        canEdit={canEdit}
        isProjectManager={isProjectManager}
        isAdmin={isAdmin}
      />
    </div>
  );
};