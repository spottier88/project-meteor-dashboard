
import { useState } from "react";
import { UserInfo } from "@/components/UserInfo";
import { ProjectModals } from "@/components/project/ProjectModals";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import { useProjectFormHandlers } from "@/hooks/useProjectFormHandlers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CompactDashboard } from "@/components/dashboard/CompactDashboard";
import { StreamlinedQuickActions } from "@/components/dashboard/StreamlinedQuickActions";
import { PriorityProjects } from "@/components/dashboard/PriorityProjects";

/**
 * Page d'accueil optimisée pour un affichage progressif
 * Affiche le contenu de base immédiatement, puis charge les données en arrière-plan
 */
const Index = () => {
  const { isLoading: isPermissionsLoading } = usePermissionsContext();

  console.log("[Index] Rendu avec isPermissionsLoading:", isPermissionsLoading);

  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { handleProjectFormSubmit } = useProjectFormHandlers(selectedProject);
  const { data: projects, isLoading: isProjectsLoading, refetch: refetchProjects } = useProjectsListView();

  /**
   * Gestionnaires d'événements pour les modales
   */
  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
    setSelectedProject(null);
  };

  const handleNewReview = () => {
    setIsProjectSelectionOpen(true);
  };

  const handleProjectSelect = (projectId: string, projectTitle: string) => {
    setSelectedProjectForReview({ id: projectId, title: projectTitle });
    setIsProjectSelectionOpen(false);
    setIsReviewSheetOpen(true);
  };

  const handleReviewClose = () => {
    setIsReviewSheetOpen(false);
    setSelectedProjectForReview(null);
  };

  const handleReviewSubmitted = () => {
    refetchProjects();
  };

  console.log("[Index] État de rendu:", {
    isPermissionsLoading,
    isProjectsLoading,
    hasProjects: !!projects
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Informations utilisateur - affichage immédiat */}
      <UserInfo />
      
      {/* En-tête - toujours visible immédiatement */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Gérez vos projets et suivez leur avancement
        </p>
      </div>

      {/* Dashboard compact - affichage immédiat avec état de chargement si nécessaire */}
      <CompactDashboard onNewProject={() => setIsProjectFormOpen(true)} />

      {/* Actions rapides - toujours visibles immédiatement */}
      <StreamlinedQuickActions 
        onNewProject={() => setIsProjectFormOpen(true)}
        onNewReview={handleNewReview}
      />

      {/* Projets prioritaires - avec gestion intelligente du chargement */}
      {isProjectsLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <PriorityProjects />
      )}

      {/* Modales - gestion indépendante du chargement principal */}
      <ProjectModals
        isProjectFormOpen={isProjectFormOpen}
        onProjectFormClose={handleProjectFormClose}
        onProjectFormSubmit={handleProjectFormSubmit}
        selectedProject={selectedProject}
        isProjectSelectionOpen={isProjectSelectionOpen}
        onProjectSelectionClose={() => setIsProjectSelectionOpen(false)}
        onProjectSelect={handleProjectSelect}
        projects={projects || []}
        isReviewSheetOpen={isReviewSheetOpen}
        onReviewClose={handleReviewClose}
        selectedProjectForReview={selectedProjectForReview}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default Index;
