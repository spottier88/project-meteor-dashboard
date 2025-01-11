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
import { FilterToggle } from "@/components/FilterToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserInfo } from "@/components/UserInfo";

export const Index = () => {
  const navigate = useNavigate();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showDgsOnly, setShowDgsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [view, setView] = useState<ViewMode>(() => {
    const savedView = localStorage.getItem("projectViewMode");
    return (savedView as ViewMode) || "grid";
  });
  
  const user = useUser();

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

  const filteredProjects = projects?.filter(project => {
    if (showDgsOnly && !project.suivi_dgs) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = project.title?.toLowerCase().includes(query);
      const matchesManager = project.project_manager?.toLowerCase().includes(query);
      return matchesTitle || matchesManager;
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
          <FilterToggle showDgsOnly={showDgsOnly} onToggle={setShowDgsOnly} />
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
