import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { ProjectSelectionSheet } from "@/components/ProjectSelectionSheet";
import { ReviewSheet } from "@/components/ReviewSheet";
import { MonitoringFilter } from "@/components/monitoring/MonitoringFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserInfo } from "@/components/UserInfo";
import { MonitoringLevel } from "@/types/monitoring";
import { AddFilteredToCartButton } from "@/components/cart/AddFilteredToCartButton";
import { LifecycleStatusFilter } from "@/components/project/LifecycleStatusFilter";
import { ProjectLifecycleStatus } from "@/types/project";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>(() => {
    const savedView = localStorage.getItem("projectViewMode");
    return (savedView as ViewMode) || "grid";
  });
  const [monitoringLevel, setMonitoringLevel] = useState<MonitoringLevel | 'all'>('all');
  const [lifecycleStatus, setLifecycleStatus] = useState<ProjectLifecycleStatus | 'all'>('all');

  const user = useUser();

  useEffect(() => {
    localStorage.setItem("projectViewMode", view);
  }, [view]);

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

  const filteredProjects = projects?.filter(project => {
    // Filtre par statut du cycle de vie
    if (lifecycleStatus !== 'all' && project.lifecycle_status !== lifecycleStatus) {
      return false;
    }

    // Filtre par niveau de monitoring
    if (monitoringLevel !== 'all') {
      if (monitoringLevel === 'none') {
        const hasNoMonitoring = !project.project_monitoring || 
                              project.project_monitoring.monitoring_level === 'none';
        return hasNoMonitoring;
      }

      const monitoring = project.project_monitoring;
      if (!monitoring) {
        return false;
      }
      
      const levelMatch = monitoring.monitoring_level === monitoringLevel;
      return levelMatch;
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = project.title?.toLowerCase().includes(query);
      const matchesManager = project.project_manager?.toLowerCase().includes(query);
      return matchesTitle || matchesManager;
    }

    return true;
  }) || [];

  console.log("Filtered projects:", filteredProjects.length, "out of", projects?.length);

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

  const handleProjectFormSubmit = async (projectData: {
    title: string;
    description: string;
    projectManager: string;
    startDate?: Date;
    endDate?: Date;
    priority: string;
    monitoringLevel: MonitoringLevel;
    monitoringEntityId: string | null;
    ownerId: string;
    poleId: string;
    directionId: string;
    serviceId: string;
    lifecycleStatus: ProjectLifecycleStatus;
    innovation: {
      novateur: number;
      usager: number;
      ouverture: number;
      agilite: number;
      impact: number;
    };
  }) => {
    console.log("Handling project form submission in Index.tsx");
    console.log("Project data received:", projectData);

    try {
      const projectPayload = {
        title: projectData.title,
        description: projectData.description,
        project_manager: projectData.projectManager,
        start_date: projectData.startDate?.toISOString().split('T')[0],
        end_date: projectData.endDate?.toISOString().split('T')[0],
        priority: projectData.priority,
        owner_id: projectData.ownerId,
        pole_id: projectData.poleId === "none" ? null : projectData.poleId,
        direction_id: projectData.directionId === "none" ? null : projectData.directionId,
        service_id: projectData.serviceId === "none" ? null : projectData.serviceId,
        lifecycle_status: projectData.lifecycleStatus,
      };

      console.log("Prepared project payload:", projectPayload);

      if (selectedProject?.id) {
        console.log("Updating existing project:", selectedProject.id);
        const { error: projectError } = await supabase
          .from("projects")
          .update(projectPayload)
          .eq("id", selectedProject.id);

        if (projectError) {
          console.error("Error updating project:", projectError);
          throw projectError;
        }

        console.log("Project updated successfully, updating monitoring...");

        const { error: monitoringError } = await supabase
          .from("project_monitoring")
          .upsert({
            project_id: selectedProject.id,
            monitoring_level: projectData.monitoringLevel,
            monitoring_entity_id: projectData.monitoringEntityId,
          }, {
            onConflict: 'project_id'
          });

        if (monitoringError) {
          console.error("Error updating monitoring:", monitoringError);
          throw monitoringError;
        }

        const { error: innovationError } = await supabase
          .from("project_innovation_scores")
          .upsert({
            project_id: selectedProject.id,
            ...projectData.innovation
          }, {
            onConflict: 'project_id'
          });

        if (innovationError) {
          console.error("Error updating innovation scores:", innovationError);
          throw innovationError;
        }
      } else {
        console.log("Creating new project");
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert(projectPayload)
          .select()
          .single();

        if (projectError) {
          console.error("Error creating project:", projectError);
          throw projectError;
        }

        console.log("New project created:", newProject);
        console.log("Creating monitoring entry...");

        const { error: monitoringError } = await supabase
          .from("project_monitoring")
          .insert({
            project_id: newProject.id,
            monitoring_level: projectData.monitoringLevel,
            monitoring_entity_id: projectData.monitoringEntityId,
          });

        if (monitoringError) {
          console.error("Error creating monitoring:", monitoringError);
          throw monitoringError;
        }

        const { error: innovationError } = await supabase
          .from("project_innovation_scores")
          .insert({
            project_id: newProject.id,
            ...projectData.innovation
          });

        if (innovationError) {
          console.error("Error creating innovation scores:", innovationError);
          throw innovationError;
        }
      }

      console.log("Project, monitoring and innovation scores saved successfully");
      await refetchProjects();
    } catch (error) {
      console.error("Error in handleProjectFormSubmit:", error);
      throw error;
    }
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

      <div className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="w-full md:w-1/3">
            <Label htmlFor="search">Rechercher un projet ou un chef de projet</Label>
            <Input
              id="search"
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <LifecycleStatusFilter
              selectedStatus={lifecycleStatus}
              onStatusChange={setLifecycleStatus}
            />
            <MonitoringFilter
              selectedLevel={monitoringLevel}
              onLevelChange={(level) => {
                console.log("Monitoring level changed to:", level);
                setMonitoringLevel(level);
              }}
            />
            <AddFilteredToCartButton 
              projectIds={filteredProjects.map(p => p.id)}
            />
          </div>
        </div>
      </div>

      <ViewToggle currentView={view} onViewChange={setView} />

      {view === "grid" ? (
        <ProjectGrid 
          projects={filteredProjects} 
          onProjectEdit={handleEditProject}
          onProjectReview={handleProjectSelect}
          onViewHistory={handleViewHistory}
        />
      ) : (
        <ProjectTable 
          projects={filteredProjects} 
          onProjectEdit={handleEditProject}
          onProjectReview={handleProjectSelect}
          onViewHistory={handleViewHistory}
          onProjectDeleted={refetchProjects}
        />
      )}

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={handleProjectFormClose}
        onSubmit={handleProjectFormSubmit}
        project={selectedProject}
      />

      <ProjectSelectionSheet
        projects={projects || []}
        isOpen={isProjectSelectionOpen}
        onClose={() => setIsProjectSelectionOpen(false)}
        onProjectSelect={handleProjectSelect}
      />

      {selectedProjectForReview && (
        <ReviewSheet
          projectId={selectedProjectForReview.id}
          projectTitle={selectedProjectForReview.title}
          isOpen={isReviewSheetOpen}
          onClose={handleReviewClose}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default Index;