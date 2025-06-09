
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UserInfo } from "@/components/UserInfo";
import { ProjectModals } from "@/components/project/ProjectModals";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import { useProjectFormHandlers } from "@/hooks/useProjectFormHandlers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
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

  const handleViewAllProjects = () => {
    navigate("/projects");
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
    <div className="container mx-auto py-8">
      <UserInfo />
      
      {/* En-tête simplifié */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Vue d'ensemble de vos projets et activités
            </p>
          </div>
          <Button onClick={handleViewAllProjects} variant="outline">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Vue détaillée
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="space-y-8">
        {/* Vue d'ensemble */}
        <DashboardOverview 
          onNewProject={() => setIsProjectFormOpen(true)}
          onViewAllProjects={handleViewAllProjects}
        />

        {/* Actions rapides */}
        <QuickActions 
          onNewProject={() => setIsProjectFormOpen(true)}
          onNewReview={handleNewReview}
        />

        {/* Activité récente */}
        <RecentActivity />
      </div>

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
