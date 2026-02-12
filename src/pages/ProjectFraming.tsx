
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { FramingDetails } from "@/components/framing/FramingDetails";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

export const ProjectFraming = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isProjectManager, isAdmin, canEdit, isSecondaryProjectManager } = useProjectPermissions(projectId || "");

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
        <h2 className="text-2xl font-bold mb-6">Éléments de cadrage</h2>
        <FramingDetails projectId={projectId || ""} />
      </div>
    </div>
  );
};
