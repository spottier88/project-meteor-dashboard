
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { ProjectsSummary } from "@/components/dashboard/ProjectsSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { UserInfo } from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { List } from "lucide-react";
import { useState } from "react";
import { ProjectModals } from "@/components/project/ProjectModals";
import { useProjectsListView } from "@/hooks/use-projects-list-view";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoading: isPermissionsLoading, isError: isPermissionsError } = usePermissionsContext();
  
  // États pour les modals
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Hook pour récupérer les projets (nécessaire pour les modals)
  const { data: projects, refetch: refetchProjects } = useProjectsListView();

  const handleNewProject = () => {
    setSelectedProject(null);
    setIsProjectFormOpen(true);
  };

  const handleNewReview = () => {
    setIsProjectSelectionOpen(true);
  };

  const handleProjectSelect = (projectId: string, projectTitle: string) => {
    setSelectedProjectForReview({ id: projectId, title: projectTitle });
    setIsProjectSelectionOpen(false);
    setIsReviewSheetOpen(true);
  };

  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
    setSelectedProject(null);
  };

  const handleReviewClose = () => {
    setIsReviewSheetOpen(false);
    setSelectedProjectForReview(null);
  };

  const handleReviewSubmitted = () => {
    refetchProjects();
  };

  // Fonction placeholder pour la soumission du projet
  const handleProjectFormSubmit = async (projectData: any) => {
    // Cette fonction devrait être implémentée selon la logique du projet
    console.log("Project data:", projectData);
    return { id: "new-project-id" };
  };

  if (isPermissionsLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
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
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <Link to="/projects">
          <Button variant="outline">
            <List className="h-4 w-4 mr-2" />
            Voir tous les projets
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone de synthèse des projets */}
        <div className="lg:col-span-2">
          <ProjectsSummary />
        </div>

        {/* Zone d'actions rapides */}
        <div>
          <QuickActions 
            onNewProject={handleNewProject}
            onNewReview={handleNewReview}
          />
        </div>
      </div>

      {/* Zone d'alertes - en pleine largeur */}
      <div className="mt-6">
        <AlertsSection />
      </div>

      {/* Modals */}
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

export default Dashboard;
