import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { TaskForm } from "@/components/task/TaskForm";
import { ProjectSummaryContent } from "@/components/project/ProjectSummaryContent";
import { ProjectForm } from "@/components/ProjectForm";
import { ReviewSheet } from "@/components/review/ReviewSheet";
import { useToast } from "@/components/ui/use-toast";

export const ProjectSummary = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const { toast } = useToast();

  console.log("🔍 ProjectSummary - Initialisation:", {
    projectId,
    component: "ProjectSummary"
  });

  const { data: project, isError: projectError, refetch: refetchProject } = useQuery({
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
    enabled: !!projectId,
  });

  const { data: lastReview, refetch: refetchLastReview } = useQuery({
    queryKey: ["lastReview", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: risks } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
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

  const handleEditProject = () => {
    setIsProjectFormOpen(true);
  };

  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
  };

  const handleCreateReview = () => {
    setIsReviewSheetOpen(true);
  };

  const handleReviewClose = () => {
    setIsReviewSheetOpen(false);
  };

  const handleReviewSubmitted = async () => {
    // Rafraîchir les données après création de la revue
    await refetchProject();
    await refetchLastReview();
    toast({
      title: "Revue créée",
      description: "La revue a été créée avec succès",
    });
  };

  const handleProjectFormSubmit = async (projectData: any) => {
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID du projet manquant",
      });
      return { id: projectId };
    }

    try {
      console.log("🔄 ProjectSummary - Mise à jour du projet:", projectData);
      
      // Effectuer la mise à jour en base de données
      const { error } = await supabase
        .from("projects")
        .update({
          title: projectData.title,
          description: projectData.description,
          project_manager: projectData.project_manager,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          priority: projectData.priority,
          lifecycle_status: projectData.lifecycle_status,
          owner_id: projectData.owner_id,
          pole_id: projectData.pole_id === "none" ? null : projectData.pole_id,
          direction_id: projectData.direction_id === "none" ? null : projectData.direction_id,
          service_id: projectData.service_id === "none" ? null : projectData.service_id,
          for_entity_type: projectData.for_entity_type,
          for_entity_id: projectData.for_entity_id,
        })
        .eq("id", projectId);

      if (error) {
        console.error("❌ ProjectSummary - Erreur lors de la mise à jour:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour le projet",
        });
        throw error;
      }

      // Gestion des données de cadrage si présentes
      if (projectData.context || projectData.objectives || projectData.governance || 
          projectData.deliverables || projectData.stakeholders || projectData.timeline) {
        
        const { error: framingError } = await supabase
          .from("project_framing")
          .upsert({
            project_id: projectId,
            context: projectData.context,
            objectives: projectData.objectives,
            governance: projectData.governance,
            deliverables: projectData.deliverables,
            stakeholders: projectData.stakeholders,
            timeline: projectData.timeline,
          }, {
            onConflict: 'project_id'
          });

        if (framingError) {
          console.error("❌ ProjectSummary - Erreur cadrage:", framingError);
        }
      }

      // Gestion des scores d'innovation si présents
      if (projectData.novateur !== undefined || projectData.usager !== undefined || 
          projectData.ouverture !== undefined || projectData.agilite !== undefined || 
          projectData.impact !== undefined) {
        
        const { error: innovationError } = await supabase
          .from("project_innovation_scores")
          .upsert({
            project_id: projectId,
            novateur: projectData.novateur || 0,
            usager: projectData.usager || 0,
            ouverture: projectData.ouverture || 0,
            agilite: projectData.agilite || 0,
            impact: projectData.impact || 0,
          }, {
            onConflict: 'project_id'
          });

        if (innovationError) {
          console.error("❌ ProjectSummary - Erreur innovation:", innovationError);
        }
      }

      // Gestion du monitoring si présent
      if (projectData.monitoringLevel && projectData.monitoringEntityId) {
        const { error: monitoringError } = await supabase
          .from("project_monitoring")
          .upsert({
            project_id: projectId,
            monitoring_level: projectData.monitoringLevel,
            monitoring_entity_id: projectData.monitoringEntityId,
          }, {
            onConflict: 'project_id'
          });

        if (monitoringError) {
          console.error("❌ ProjectSummary - Erreur monitoring:", monitoringError);
        }
      }

      console.log("✅ ProjectSummary - Projet mis à jour avec succès");
      
      toast({
        title: "Succès",
        description: "Le projet a été mis à jour avec succès",
      });

      // Rafraîchir les données après sauvegarde réussie
      await refetchProject();
      
      return { id: projectId };

    } catch (error) {
      console.error("❌ ProjectSummary - Erreur générale:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
      });
      throw error;
    }
  };

  if (!project || projectError) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>

      <ProjectSummaryContent
        project={project}
        lastReview={lastReview}
        risks={risks || []}
        tasks={tasks || []}
        onEditProject={handleEditProject}
        onCreateReview={handleCreateReview}
      />

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        projectId={projectId || ""}
      />

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={handleProjectFormClose}
        onSubmit={handleProjectFormSubmit}
        project={project}
      />

      {project && (
        <ReviewSheet
          projectId={project.id}
          projectTitle={project.title}
          isOpen={isReviewSheetOpen}
          onClose={handleReviewClose}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};
