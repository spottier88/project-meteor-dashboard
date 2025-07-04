
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TeamManagement } from "@/components/project/TeamManagement";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useToast } from "@/components/ui/use-toast";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";

export const ProjectTeamManagement = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Centraliser le chargement des permissions ici aussi
  const projectPermissions = useProjectPermissions(projectId || "");

  const { data: project } = useQuery({
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

  if (!project) {
    return <div>Chargement...</div>;
  }

  if (!projectPermissions.canManageTeam) {
    navigate("/");
    return null;
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

      <ProjectSummaryHeader
        title={project.title}
        description={project.description}
        project_manager={project.project_manager}
        id={project.id}
        isProjectManager={projectPermissions.isProjectManager}
        isAdmin={projectPermissions.isAdmin}
        start_date={project.start_date}
        end_date={project.end_date}
      />

      <div className="mt-8">
        <TeamManagement 
          projectId={projectId || ""} 
          permissions={{
            canEdit: projectPermissions.canEdit,
            isProjectManager: projectPermissions.isProjectManager,
            isAdmin: projectPermissions.isAdmin,
            canManageTeam: projectPermissions.canManageTeam,
          }}
        />
      </div>
    </div>
  );
};
