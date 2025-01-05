import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { ProjectSelectionSheet } from "@/components/ProjectSelectionSheet";
import { ReviewSheet } from "@/components/ReviewSheet";
import { ReviewHistory } from "@/components/ReviewHistory";

const Index = () => {
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [isReviewHistoryOpen, setIsReviewHistoryOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedProjectForHistory, setSelectedProjectForHistory] = useState<{
    id: string;
    title: string;
  } | null>(null);
  
  // Initialize view state from localStorage or default to "grid"
  const [view, setView] = useState<ViewMode>(() => {
    const savedView = localStorage.getItem("projectViewMode");
    return (savedView as ViewMode) || "grid";
  });
  
  const user = useUser();

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("projectViewMode", view);
  }, [view]);

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
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
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data?.map(project => ({
        ...project,
        lastReviewDate: project.last_review_date,
      })) || [];
    },
  });

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
    setSelectedProjectForHistory({ id: projectId, title: projectTitle });
    setIsReviewHistoryOpen(true);
  };

  const handleHistoryClose = () => {
    setIsReviewHistoryOpen(false);
    setSelectedProjectForHistory(null);
  };

  return (
    <div className="container mx-auto py-8">
      <DashboardHeader
        onNewProject={() => setIsProjectFormOpen(true)}
        onNewReview={handleNewReview}
      />

      <ViewToggle currentView={view} onViewChange={setView} />

      {view === "grid" ? (
        <ProjectGrid 
          projects={projects || []} 
          onProjectEdit={handleEditProject}
          onProjectReview={handleProjectSelect}
          onViewHistory={handleViewHistory}
        />
      ) : (
        <ProjectTable 
          projects={projects || []} 
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

      {selectedProjectForHistory && (
        <ReviewHistory
          projectId={selectedProjectForHistory.id}
          projectTitle={selectedProjectForHistory.title}
          onClose={handleHistoryClose}
        />
      )}
    </div>
  );
};

export default Index;