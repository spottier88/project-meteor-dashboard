import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UserInfo } from "@/components/UserInfo";
import { ViewMode } from "@/components/ViewToggle";
import { MonitoringLevel } from "@/types/monitoring";
import { ProjectLifecycleStatus } from "@/types/project";
import { ProjectFilters } from "@/components/project/ProjectFilters";
import { ProjectList } from "@/components/project/ProjectList";
import { ProjectModals } from "@/components/project/ProjectModals";
import { TeamManagement } from "@/components/project/TeamManagement";

const Index = () => {
  const navigate = useNavigate();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<string | null>(null);
  
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

  const user = useUser();

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

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      console.log("Fetching projects with monitoring data...");
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          poles (
            id,
            name
          ),
          directions (
            id,
            name
          ),
          services (
            id,
            name
          ),
          project_monitoring!left (
            monitoring_level,
            monitoring_entity_id
          )
        `)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        throw projectsError;
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("latest_reviews")
        .select("*");

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        throw reviewsError;
      }

      return projectsData?.map(project => {
        const latestReview = reviewsData?.find(review => review.project_id === project.id);
        return {
          ...project,
          status: latestReview?.weather || null,
          progress: latestReview?.progress || null,
          completion: latestReview?.completion || 0,
          lastReviewDate: project.last_review_date,
        };
      }) || [];
    },
  });

  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
    setSelectedProject(null);
  };

  const handleProjectFormSubmit = async (projectData: any) => {
    try {
      if (selectedProject) {
        // Update existing project
        const { error: updateError } = await supabase
          .from("projects")
          .update({
            title: projectData.title,
            description: projectData.description,
            project_manager: projectData.projectManager,
            start_date: projectData.startDate,
            end_date: projectData.endDate,
            priority: projectData.priority,
            owner_id: projectData.ownerId,
            pole_id: projectData.poleId,
            direction_id: projectData.directionId,
            service_id: projectData.serviceId,
            lifecycle_status: projectData.lifecycleStatus,
          })
          .eq("id", selectedProject.id);

        if (updateError) throw updateError;

        // Update monitoring
        const { error: monitoringError } = await supabase
          .from("project_monitoring")
          .upsert({
            project_id: selectedProject.id,
            monitoring_level: projectData.monitoringLevel,
            monitoring_entity_id: projectData.monitoringEntityId,
          });

        if (monitoringError) throw monitoringError;

        // Update innovation scores
        const { error: innovationError } = await supabase
          .from("project_innovation_scores")
          .upsert({
            project_id: selectedProject.id,
            ...projectData.innovation,
          });

        if (innovationError) throw innovationError;
      } else {
        // Create new project
        const { data: newProject, error: createError } = await supabase
          .from("projects")
          .insert({
            title: projectData.title,
            description: projectData.description,
            project_manager: projectData.projectManager,
            start_date: projectData.startDate,
            end_date: projectData.endDate,
            priority: projectData.priority,
            owner_id: projectData.ownerId,
            pole_id: projectData.poleId,
            direction_id: projectData.directionId,
            service_id: projectData.serviceId,
            lifecycle_status: projectData.lifecycleStatus,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Create monitoring
        const { error: monitoringError } = await supabase
          .from("project_monitoring")
          .insert({
            project_id: newProject.id,
            monitoring_level: projectData.monitoringLevel,
            monitoring_entity_id: projectData.monitoringEntityId,
          });

        if (monitoringError) throw monitoringError;

        // Create innovation scores
        const { error: innovationError } = await supabase
          .from("project_innovation_scores")
          .insert({
            project_id: newProject.id,
            ...projectData.innovation,
          });

        if (innovationError) throw innovationError;
      }

      await refetchProjects();
    } catch (error) {
      console.error("Error submitting project:", error);
      throw error;
    }
  };

  const handleEditProject = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setIsProjectFormOpen(true);
    }
  };

  const handleTeamManagement = (projectId: string) => {
    setSelectedProjectForTeam(projectId);
    setIsTeamManagementOpen(true);
  };

  const handleTeamManagementClose = () => {
    setIsTeamManagementOpen(false);
    setSelectedProjectForTeam(null);
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

  return (
    <div className="container mx-auto py-8">
      <UserInfo />
      <DashboardHeader
        onNewProject={() => setIsProjectFormOpen(true)}
        onNewReview={handleNewReview}
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
        filteredProjectIds={projects?.map(p => p.id) || []}
      />

      <ProjectList
        view={view}
        onViewChange={setView}
        projects={projects || []}
        onProjectEdit={handleEditProject}
        onProjectReview={handleProjectSelect}
        onViewHistory={handleViewHistory}
        onProjectDeleted={refetchProjects}
        onTeamManagement={handleTeamManagement}
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

      {selectedProjectForTeam && (
        <TeamManagement
          isOpen={isTeamManagementOpen}
          onClose={handleTeamManagementClose}
          projectId={selectedProjectForTeam}
        />
      )}
    </div>
  );
};

export default Index;