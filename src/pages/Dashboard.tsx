
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { ProjectsSummary } from "@/components/dashboard/ProjectsSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { UserInfo } from "@/components/UserInfo";
import { useState } from "react";
import { ProjectModals } from "@/components/project/ProjectModals";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { useOnboarding } from "@/hooks/useOnboarding";
import { IncompleteProfileDialog } from "@/components/profile/IncompleteProfileDialog";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const user = useUser();
  const { isLoading: isPermissionsLoading, isError: isPermissionsError } = usePermissionsContext();
  
  // Hook pour gérer le tutoriel de prise en main
  const { isOpen: isOnboardingOpen, closeTutorial, openTutorial } = useOnboarding();
  
  // États pour les modals
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  
  // État pour la modale de profil (scénario 1)
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  // Récupération du profil utilisateur pour ProfileForm
  const { data: userProfile } = useQuery({
    queryKey: ["dashboardUserProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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

  // Fonction de soumission du projet (callback optionnel)
  const handleProjectFormSubmit = async (projectData: any) => {
    console.log("Projet créé avec succès:", projectData);
    return projectData;
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
      {/* Tutoriel de prise en main pour les nouveaux utilisateurs */}
      <OnboardingTutorial 
        isOpen={isOnboardingOpen} 
        onClose={closeTutorial}
      />
      
      {/* Modale d'incitation à compléter le profil (utilisateurs existants) */}
      <IncompleteProfileDialog onOpenProfile={() => setIsProfileFormOpen(true)} />
      
      {/* Formulaire de profil */}
      <ProfileForm 
        isOpen={isProfileFormOpen} 
        onClose={() => setIsProfileFormOpen(false)} 
        profile={userProfile || null}
      />
      
      <UserInfo onOpenTutorial={openTutorial} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectsSummary />
        </div>
        <div>
          <QuickActions 
            onNewProject={handleNewProject}
            onNewReview={handleNewReview}
          />
        </div>
      </div>

      <div className="mt-6">
        <AlertsSection />
      </div>

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
