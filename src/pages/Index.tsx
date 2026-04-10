import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UserInfo } from "@/components/UserInfo";
import { ViewMode } from "@/components/ViewToggle";
import { MonitoringLevel } from "@/types/monitoring";
import { ProjectLifecycleStatus } from "@/types/project";
import { ProjectFilters } from "@/components/project/ProjectFilters";
import { ProjectList } from "@/components/project/ProjectList";
import { ProjectModals } from "@/components/project/ProjectModals";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useProjectsListView } from "@/hooks/useProjectsListView";
import { useUserProjectMemberships } from "@/hooks/useUserProjectMemberships";
import { useVisibleProjects } from "@/hooks/useVisibleProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectListItem } from "@/hooks/useProjectsListView";
import { differenceInDays } from "date-fns";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

/**
 * Lecture one-shot des filtres dashboard depuis localStorage.
 * Les clés sont supprimées après lecture pour ne pas persister.
 */
const readAndClearDashboardFilter = (key: string): string | null => {
  const value = localStorage.getItem(key);
  if (value !== null) {
    localStorage.removeItem(key);
  }
  return value;
};

const Index = () => {
  const navigate = useNavigate();
  const { isLoading: isPermissionsLoading, isError: isPermissionsError, userProfile } = usePermissionsContext();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  
  // Filtres dashboard one-shot (lus une seule fois au montage)
  const [dashboardRoleFilter, setDashboardRoleFilter] = useState<string | null>(null);
  const [dashboardWeatherFilter, setDashboardWeatherFilter] = useState<string | null>(null);
  const [dashboardWithoutReviewFilter, setDashboardWithoutReviewFilter] = useState<boolean>(false);

  // Lecture one-shot au montage
  useEffect(() => {
    const role = readAndClearDashboardFilter("dashboardRoleFilter");
    const weather = readAndClearDashboardFilter("dashboardWeatherFilter");
    const withoutReview = readAndClearDashboardFilter("dashboardWithoutReviewFilter");
    if (role) setDashboardRoleFilter(role);
    if (weather) setDashboardWeatherFilter(weather);
    if (withoutReview === "true") setDashboardWithoutReviewFilter(true);
  }, []);

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Toggle pour afficher/masquer les projets terminés (masqués par défaut)
  const [showCompletedProjects, setShowCompletedProjects] = useState(() => {
    return localStorage.getItem("showCompletedProjects") === "true";
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

  useEffect(() => {
    localStorage.setItem("showCompletedProjects", showCompletedProjects.toString());
  }, [showCompletedProjects]);

  // Utilisation du hook optimisé
  const { data: projects, isLoading: isProjectsLoading, refetch: refetchProjects } = useProjectsListView();

  // Récupérer les projets dont l'utilisateur est membre (via hook centralisé)
  const { data: userMemberships } = useUserProjectMemberships();

  // Charger les tags de tous les projets pour le filtrage côté client
  const { data: projectTagsMap } = useQuery({
    queryKey: ["all-project-tags-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tags")
        .select("project_id, tag");
      if (error) {
        console.error("Erreur chargement tags projets:", error);
        return new Map<string, string[]>();
      }
      const map = new Map<string, string[]>();
      for (const row of data) {
        const existing = map.get(row.project_id) || [];
        existing.push(row.tag);
        map.set(row.project_id, existing);
      }
      return map;
    },
  });

  /** Réinitialiser les filtres dashboard */
  const handleResetDashboardFilters = () => {
    setDashboardRoleFilter(null);
    setDashboardWeatherFilter(null);
    setDashboardWithoutReviewFilter(false);
  };

  const hasDashboardFilters = !!(dashboardRoleFilter || dashboardWeatherFilter || dashboardWithoutReviewFilter);

  // Appliquer les filtres métier sur tous les projets
  const filteredProjects = useMemo(() => {
    return (projects || []).filter(project => {
      // Masquer les projets terminés sauf si le toggle est activé
      if (!showCompletedProjects && project.lifecycle_status === 'completed') {
        return false;
      }

      if (lifecycleStatus !== 'all' && project.lifecycle_status !== lifecycleStatus) {
        return false;
      }

      if (monitoringLevel !== 'all') {
        if (monitoringLevel === 'none') {
          const hasNoMonitoring = !project.monitoring_level || 
                                project.monitoring_level === 'none';
          if (!hasNoMonitoring) return false;
        } else {
          if (!project.monitoring_level || project.monitoring_level !== monitoringLevel) {
            return false;
          }
        }
      }

      // Filtre "Mes projets" : chef de projet OU membre
      if (showMyProjectsOnly && userProfile) {
        const isProjectManager = project.project_manager === userProfile.email;
        const isMember = userMemberships?.has(project.id) || false;
        
        if (!isProjectManager && !isMember) {
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
        
        if (!matchesTitle && !matchesManager && !matchesManagerName) return false;
      }

      // Filtre par tags
      if (selectedTags.length > 0 && projectTagsMap) {
        const projectTags = projectTagsMap.get(project.id) || [];
        const hasMatchingTag = selectedTags.some(t => projectTags.includes(t));
        if (!hasMatchingTag) return false;
      }

      // --- Filtres dashboard one-shot ---
      if (dashboardRoleFilter && userProfile) {
        const isProjectManager = project.project_manager === userProfile.email;
        const isMember = userMemberships?.has(project.id) || false;

        if (dashboardRoleFilter === "cp" && !isProjectManager) return false;
        if (dashboardRoleFilter === "member" && (!isMember || isProjectManager)) return false;
        if (dashboardRoleFilter === "manager" && (isProjectManager || isMember)) return false;
      }

      if (dashboardWeatherFilter) {
        const projectWeather = project.weather || 'null';
        if (projectWeather !== dashboardWeatherFilter) return false;
      }

      if (dashboardWithoutReviewFilter) {
        const isActive = project.lifecycle_status === 'in_progress';
        if (!isActive) return false;
        if (project.last_review_date) {
          const daysSince = differenceInDays(new Date(), new Date(project.last_review_date));
          if (daysSince <= 30) return false;
        }
      }

      return true;
    });
  }, [projects, lifecycleStatus, monitoringLevel, showMyProjectsOnly, showCompletedProjects, userProfile, userMemberships, poleId, directionId, serviceId, searchQuery, selectedTags, projectTagsMap, dashboardRoleFilter, dashboardWeatherFilter, dashboardWithoutReviewFilter]);

  // Calcul centralisé des projets visibles (permissions d'accès)
  const { visibleProjects, visibleProjectIds } = useVisibleProjects(filteredProjects);

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
  const handleProjectFormSubmit = async (projectData: unknown) => {
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
    void navigate(`/reviews/${projectId}`);
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
        filteredProjectIds={visibleProjectIds}
        poleId={poleId}
        onPoleChange={setPoleId}
        directionId={directionId}
        onDirectionChange={setDirectionId}
        serviceId={serviceId}
        onServiceChange={setServiceId}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        showCompletedProjects={showCompletedProjects}
        onShowCompletedToggle={setShowCompletedProjects}
        dashboardRoleFilter={dashboardRoleFilter}
        dashboardWeatherFilter={dashboardWeatherFilter}
        dashboardWithoutReviewFilter={dashboardWithoutReviewFilter}
        onResetDashboardFilters={handleResetDashboardFilters}
      />

      <ProjectList
        view={view}
        onViewChange={setView}
        projects={visibleProjects}
        onProjectEdit={handleEditProject}
        onProjectReview={handleProjectSelect}
        onViewHistory={handleViewHistory}
        onProjectDeleted={refetchProjects}
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
