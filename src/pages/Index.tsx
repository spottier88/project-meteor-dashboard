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

  const user = useUser();

  useEffect(() => {
    localStorage.setItem("projectViewMode", view);
  }, [view]);

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      console.log("Fetching projects with monitoring data...");
      const { data, error } = await supabase
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

      if (error) {
        console.error("Error fetching projects:", error);
        throw error;
      }
      
      console.log("Raw projects data:", data);
      
      return data?.map(project => ({
        ...project,
        lastReviewDate: project.last_review_date,
      })) || [];
    },
  });

  const filteredProjects = projects?.filter(project => {
    // Filtre par niveau de suivi
    if (monitoringLevel !== 'all') {
      console.log(`Filtering project ${project.title}:`, {
        monitoringLevel,
        projectMonitoring: project.project_monitoring,
      });

      if (monitoringLevel === 'none') {
        const hasNoMonitoring = !project.project_monitoring || project.project_monitoring.length === 0;
        console.log(`Project has no monitoring? ${hasNoMonitoring}`);
        return hasNoMonitoring;
      }

      const monitoring = project.project_monitoring?.[0];
      if (!monitoring) {
        console.log(`Project has no monitoring, but filter is not 'none'`);
        return false;
      }
      
      const levelMatch = monitoring.monitoring_level === monitoringLevel;
      console.log(`Project monitoring level: ${monitoring.monitoring_level}. Matches filter? ${levelMatch}`);
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

  const handleProjectFormSubmit = () => {
    refetchProjects();
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
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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
          <MonitoringFilter
            selectedLevel={monitoringLevel}
            onLevelChange={(level) => {
              console.log("Monitoring level changed to:", level);
              setMonitoringLevel(level);
            }}
          />
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