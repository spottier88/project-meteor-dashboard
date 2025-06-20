
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

const Index = () => {
  const { isLoading: isPermissionsLoading, isError: isPermissionsError } = usePermissionsContext();

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

  if (isPermissionsLoading || isProjectsLoading) {
    return <LoadingSpinner />;
  }

  if (isPermissionsError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600">
          Une erreur s'est produite lors du chargement des permissions.
          Veuillez rafraîchir la page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <UserInfo />
      
      {/* En-tête simple */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Gérez vos projets et suivez leur avancement
        </p>
      </div>

      {/* Dashboard compact */}
      <CompactDashboard onNewProject={() => setIsProjectFormOpen(true)} />

      {/* Actions rapides simplifiées */}
      <StreamlinedQuickActions 
        onNewProject={() => setIsProjectFormOpen(true)}
        onNewReview={handleNewReview}
      />

      {/* Projets prioritaires */}
      <PriorityProjects />

      {/* Modales existantes */}
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
