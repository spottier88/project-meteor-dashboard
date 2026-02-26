
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/TaskList";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useToast } from "@/components/ui/use-toast";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { PortfolioReadOnlyBadge } from "@/components/project/PortfolioReadOnlyBadge";
import { exportTasksToExcel } from "@/utils/activityExport";

export const TaskManagement = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit, isProjectManager, isAdmin, isSecondaryProjectManager, isReadOnlyViaPortfolio, portfolioAccessInfo } = useProjectPermissions(projectId || "");

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

  // Récupération de toutes les tâches pour l'export
  const { data: allTasks } = useQuery({
    queryKey: ["allTasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const handleExportTasks = () => {
    if (allTasks && allTasks.length > 0 && project) {
      exportTasksToExcel(allTasks, project.title);
      toast({
        title: "Export réussi",
        description: "La liste des tâches a été exportée avec succès.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erreur d'export",
        description: "Aucune tâche à exporter.",
      });
    }
  };

  if (!project) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
          {/* Afficher le badge lecture seule si applicable */}
          {isReadOnlyViaPortfolio && (
            <PortfolioReadOnlyBadge portfolioName={portfolioAccessInfo?.portfolioName} />
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={handleExportTasks}
          className="ml-auto"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter les tâches
        </Button>
      </div>

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
        <TaskList 
          projectId={projectId || ""}
          canEdit={isReadOnlyViaPortfolio ? false : canEdit}
          isProjectManager={isProjectManager}
          isAdmin={isReadOnlyViaPortfolio ? false : isAdmin}
          projectTitle={project.title}
        />
      </div>
    </div>
  );
};
