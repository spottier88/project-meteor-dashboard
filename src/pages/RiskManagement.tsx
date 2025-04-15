
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RiskList } from "@/components/RiskList";
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { Project } from "@/types/user";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useToast } from "@/components/ui/use-toast";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";

export const RiskManagement = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canEdit, isProjectManager, isAdmin, isSecondaryProjectManager } = useProjectPermissions(projectId || "");

  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) {
        navigate("/");
        return null;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger le projet",
        });
        throw error;
      }

      if (!data) {
        toast({
          variant: "destructive",
          title: "Projet non trouvé",
          description: "Le projet demandé n'existe pas",
        });
        navigate("/");
        return null;
      }

      return data;
    },
  });

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Chargement...</div>;
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          Une erreur est survenue lors du chargement du projet
        </div>
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  // Fonction pour rafraîchir les données
  const refreshData = () => {
    refetch();
  };

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

      <ProjectSummaryHeader
        title={project.title}
        description={project.description}
        project_manager={project.project_manager}
        id={project.id}
        isProjectManager={isProjectManager}
        isAdmin={isAdmin}
        start_date={project.start_date}
        end_date={project.end_date}
      />

      <div className="mt-8">
        <RiskList 
          projectId={projectId || ""} 
          projectTitle={project.title}
          canEdit={canEdit}
          isProjectManager={isProjectManager}
          isAdmin={isAdmin}
          onUpdate={refreshData}
        />
      </div>
    </div>
  );
};
