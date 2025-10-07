import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UserInfo } from "@/components/UserInfo";
import { ViewMode } from "@/components/ViewToggle";
import { MonitoringLevel } from "@/types/monitoring";
import { ProjectLifecycleStatus, ForEntityType } from "@/types/project";
import { ProjectFilters } from "@/components/project/ProjectFilters";
import { ProjectList } from "@/components/project/ProjectList";
import { ProjectModals } from "@/components/project/ProjectModals";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useProjectsListView } from "@/hooks/use-projects-list-view";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { isLoading: isPermissionsLoading, isError: isPermissionsError, userProfile } = usePermissionsContext();
  const user = useUser();

  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem("projectSearchQuery") || "";
  });
  const [view, setView] = useState<ViewMode>(() => {
    return (localStorage.getItem("projectViewMode") as ViewMode) || "grid";
  });
  const [monitoringLevel, setMonitoringLevel] = useState<MonitoringLevel | 'all'>(() => {
    return (localStorage.getItem("projectMonitoringLevel") as MonitoringLevel | 'all') || 'all';
  });
  const [lifecycleStatus, setLifecycleStatus] = useState<ProjectLifecycleStatus | 'all'>(() => {
    return (localStorage.getItem("projectLifecycleStatus") as ProjectLifecycleStatus | 'all') || 'all';
  });
  const [showMyProjectsOnly, setShowMyProjectsOnly] = useState(() => {
    return localStorage.getItem("showMyProjectsOnly") === "true";
  });
  
  const [poleId, setPoleId] = useState<string>(() => {
    return localStorage.getItem("projectPoleId") || "all";
  });
  const [directionId, setDirectionId] = useState<string>(() => {
    return localStorage.getItem("projectDirectionId") || "all";
  });
  const [serviceId, setServiceId] = useState<string>(() => {
    return localStorage.getItem("projectServiceId") || "all";
  });

  useEffect(() => {
    localStorage.setItem("projectViewMode", view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem("projectSearchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("projectMonitoringLevel", monitoringLevel);
  }, [monitoringLevel]);

  useEffect(() => {
    localStorage.setItem("projectLifecycleStatus", lifecycleStatus);
  }, [lifecycleStatus]);

  useEffect(() => {
    localStorage.setItem("showMyProjectsOnly", showMyProjectsOnly.toString());
  }, [showMyProjectsOnly]);
  
  useEffect(() => {
    localStorage.setItem("projectPoleId", poleId);
  }, [poleId]);
  
  useEffect(() => {
    localStorage.setItem("projectDirectionId", directionId);
  }, [directionId]);
  
  useEffect(() => {
    localStorage.setItem("projectServiceId", serviceId);
  }, [serviceId]);

  // Utilisation du hook optimisé
  const { data: projects, isLoading: isProjectsLoading, refetch: refetchProjects } = useProjectsListView();

  const [accessibleProjectIds, setAccessibleProjectIds] = useState<string[]>([]);

  const handleFilteredProjectsChange = (projectIds: string[]) => {
    setAccessibleProjectIds(projectIds);
  };

  const filteredProjects = projects?.filter(project => {
    if (lifecycleStatus !== 'all' && project.lifecycle_status !== lifecycleStatus) {
      return false;
    }

    if (monitoringLevel !== 'all') {
      if (monitoringLevel === 'none') {
        const hasNoMonitoring = !project.monitoring_level || 
                              project.monitoring_level === 'none';
        return hasNoMonitoring;
      }

      if (!project.monitoring_level) {
        return false;
      }
      
      const levelMatch = project.monitoring_level === monitoringLevel;
      return levelMatch;
    }

    if (showMyProjectsOnly && userProfile) {
      if (project.project_manager !== userProfile.email) {
        return false;
      }
    }
    
    if (poleId !== "all") {
      if (poleId === "none") {
        if (project.pole_id !== null) return false;
      } else {
        if (project.pole_id !== poleId) return false;
      }
    }
    
    if (directionId !== "all") {
      if (directionId === "none") {
        if (project.direction_id !== null) return false;
      } else {
        if (project.direction_id !== directionId) return false;
      }
    }
    
    if (serviceId !== "all") {
      if (serviceId === "none") {
        if (project.service_id !== null) return false;
      } else {
        if (project.service_id !== serviceId) return false;
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = project.title?.toLowerCase().includes(query);
      const matchesManager = project.project_manager?.toLowerCase().includes(query);
      const matchesManagerName = project.project_manager_name?.toLowerCase().includes(query);
      
      return matchesTitle || matchesManager || matchesManagerName;
    }

    return true;
  }) || [];

  const handleEditProject = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setIsProjectFormOpen(true);
    }
  };

  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
    setSelectedProject(null);
  };

  // Fonction de soumission du projet (callback simple après création)
  const handleProjectFormSubmit = async (projectData: any) => {
    // La logique complète est gérée dans useProjectSubmit
    // Cette fonction sert uniquement de callback après la création
    console.log("Projet créé/mis à jour avec succès:", projectData);
    return projectData;
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

  const handleViewHistory = (projectId: string, projectTitle: string) => {
    navigate(`/reviews/${projectId}`);
  };

  const handleNewFrameworkNote = () => {
    setIsProjectSelectionOpen(true);
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
      <DashboardHeader
        onNewProject={() => setIsProjectFormOpen(true)}
        onNewReview={handleNewReview}
        onNewFrameworkNote={handleNewFrameworkNote}
      />

      <ProjectFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        lifecycleStatus={lifecycleStatus}
        onLifecycleStatusChange={setLifecycleStatus}
        monitoringLevel={monitoringLevel}
        onMonitoringLevelChange={setMonitoringLevel}
        showMyProjectsOnly={showMyProjectsOnly}
        onMyProjectsToggle={setShowMyProjectsOnly}
        filteredProjectIds={accessibleProjectIds}
        poleId={poleId}
        onPoleChange={setPoleId}
        directionId={directionId}
        onDirectionChange={setDirectionId}
        serviceId={serviceId}
        onServiceChange={setServiceId}
      />

      <ProjectList
        view={view}
        onViewChange={setView}
        projects={filteredProjects}
        onProjectEdit={handleEditProject}
        onProjectReview={handleProjectSelect}
        onViewHistory={handleViewHistory}
        onProjectDeleted={refetchProjects}
        onFilteredProjectsChange={handleFilteredProjectsChange}
      />

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
