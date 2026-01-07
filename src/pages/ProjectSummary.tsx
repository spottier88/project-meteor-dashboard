
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { TaskForm } from "@/components/task/TaskForm";
import { ProjectSummaryContent } from "@/components/project/ProjectSummaryContent";
import { ProjectForm } from "@/components/ProjectForm";
import { ReviewSheet } from "@/components/review/ReviewSheet";
import { useToast } from "@/components/ui/use-toast";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useTeamManagement } from "@/hooks/use-team-management";
import { useProjectInnovationScores } from "@/hooks/useProjectInnovationScores";
import { useProjectSubmit } from "@/hooks/useProjectSubmit";
import { useProjectFormState } from "@/components/form/useProjectFormState";
import { LinkedProjectRedirect } from "@/components/project/LinkedProjectRedirect";
import { ProjectLinkBadge } from "@/components/project/ProjectLinkBadge";
import { LinkedProjectsSection } from "@/components/project/LinkedProjectsSection";
import { useAggregatedProjectData } from "@/hooks/useAggregatedProjectData";

export const ProjectSummary = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const { toast } = useToast();

  // Centraliser le chargement des permissions au niveau parent avec un état stable
  const projectPermissions = useProjectPermissions(projectId || "");

  // Précharger les données des membres pour éviter les problèmes de cache
  const teamManagement = useTeamManagement(projectId || "", projectPermissions);

  // Charger les scores d'innovation séparément
  const { data: innovationScores } = useProjectInnovationScores(projectId || "");

  // État du formulaire pour l'utilisation avec useProjectSubmit
  const formState = useProjectFormState(false, null);

  // Récupérer les données agrégées pour les projets maîtres
  const { aggregatedTasks, aggregatedRisks, linkedProjectsCount } = useAggregatedProjectData(projectId || "");

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

  // Récupérer les 2 dernières revues pour afficher la météo précédente
  const { data: reviewsData, refetch: refetchLastReview } = useQuery({
    queryKey: ["lastReviews", projectId],
    queryFn: async () => {
      if (!projectId) return { current: null, previous: null };
      
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(2);

      if (error) return { current: null, previous: null };
      return {
        current: data?.[0] || null,
        previous: data?.[1] || null,
      };
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

  // Utiliser le hook useProjectSubmit pour gérer l'enregistrement
  const { submitProject } = useProjectSubmit({ 
    project, 
    onSubmit: async (projectData: any) => {
      // La logique d'enregistrement est maintenant gérée par useProjectSubmit
      // Nous retournons simplement l'ID du projet pour la compatibilité
      return { id: projectId };
    }, 
    onClose: () => {
      setIsProjectFormOpen(false);
    }, 
    formState 
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

  const handleClosureComplete = async () => {
    await refetchProject();
    await refetchLastReview();
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
      // Utiliser le hook useProjectSubmit qui gère correctement tous les éléments connexes
      await submitProject();

      toast({
        title: "Succès",
        description: "Le projet a été mis à jour avec succès",
      });

      // Rafraîchir les données après sauvegarde réussie
      await refetchProject();
      
      return { id: projectId };

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
      });
      throw error;
    }
  };

  const handleBackNavigation = () => {
    // Si nous avons un état de navigation avec une page précédente
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      // Sinon, utiliser l'historique du navigateur pour revenir en arrière
      navigate(-1);
    }
  };

  const getBackButtonText = () => {
    // Déterminer le texte basé sur l'état de navigation ou l'URL actuelle
    if (location.state?.from) {
      if (location.state.from === '/projects') {
        return 'Retour aux projets';
      } else if (location.state.from.startsWith('/portfolios')) {
        return 'Retour au portefeuille';
      }
    }
    
    // Vérifier l'URL de référence si pas d'état de navigation
    const referrer = document.referrer;
    if (referrer) {
      if (referrer.includes('/projects') && !referrer.includes('/portfolios')) {
        return 'Retour aux projets';
      } else if (referrer.includes('/portfolios')) {
        return 'Retour au portefeuille';
      }
    }
    
    return 'Retour à la page précédente';
  };

  if (!project || projectError) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Redirection automatique si projet lié */}
      <LinkedProjectRedirect projectId={projectId || ""} />
      
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBackNavigation}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {getBackButtonText()}
        </Button>
        <ProjectLinkBadge projectId={projectId || ""} />
      </div>

      {/* Section des projets liés (si maître) */}
      {linkedProjectsCount > 0 && (
        <LinkedProjectsSection 
          masterProjectId={projectId || ""} 
          isAdmin={projectPermissions.isAdmin} 
        />
      )}

      <ProjectSummaryContent
        project={project}
        lastReview={reviewsData?.current}
        previousReview={reviewsData?.previous}
        risks={aggregatedRisks || risks || []}
        tasks={aggregatedTasks || tasks || []}
        innovationScores={innovationScores}
        onEditProject={handleEditProject}
        onCreateReview={handleCreateReview}
        onClosureComplete={handleClosureComplete}
        permissions={projectPermissions}
        teamManagement={teamManagement}
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
