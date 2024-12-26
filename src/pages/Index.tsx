import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { ViewToggle } from "@/components/ViewToggle";
import { ReviewSheet } from "@/components/ReviewSheet";
import { ProjectForm } from "@/components/ProjectForm";
import { ReviewHistory } from "@/components/ReviewHistory";
import { ProjectSelectionSheet } from "@/components/ProjectSelectionSheet";
import { ProjectStatus, ProgressStatus } from "@/components/ProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
  description?: string;
  project_manager?: string;
  start_date?: string;
  end_date?: string;
  priority?: string;
  suivi_dgs?: boolean;
};

type ViewMode = "grid" | "table";

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("last_review_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((project) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    progress: project.progress,
    completion: project.completion,
    lastReviewDate: new Date(project.last_review_date || "").toLocaleDateString(
      "fr-FR"
    ),
    description: project.description,
    project_manager: project.project_manager,
    start_date: project.start_date,
    end_date: project.end_date,
    priority: project.priority,
    suivi_dgs: project.suivi_dgs,
  }));
};

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProjectForHistory, setSelectedProjectForHistory] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const savedView = localStorage.getItem("preferredView");
    return (savedView as ViewMode) || "grid";
  });
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  // Sauvegarder la vue active dans le localStorage
  useEffect(() => {
    localStorage.setItem("preferredView", currentView);
  }, [currentView]);

  const handleNewProject = () => {
    setProjectToEdit(null);
    setIsProjectFormOpen(true);
  };

  const handleEditProject = (id: string) => {
    const project = projects?.find((p) => p.id === id);
    if (project) {
      setProjectToEdit(project);
      setIsProjectFormOpen(true);
    }
  };

  const handleNewReview = () => {
    setIsProjectSelectionOpen(true);
  };

  const handleProjectSelect = (id: string, title: string) => {
    setSelectedProject({ id, title });
    setIsProjectSelectionOpen(false);
  };

  const handleProjectReview = (id: string, title: string) => {
    setSelectedProject({ id, title });
  };

  const handleViewHistory = (id: string, title: string) => {
    setSelectedProjectForHistory({ id, title });
  };

  const handleReviewSubmitted = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Chargement des projets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <p className="text-lg text-destructive">
          Une erreur est survenue lors du chargement des projets.
        </p>
      </div>
    );
  }

  if (selectedProjectForHistory) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <ReviewHistory
          projectId={selectedProjectForHistory.id}
          projectTitle={selectedProjectForHistory.title}
          onClose={() => setSelectedProjectForHistory(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen animate-fade-in">
      <DashboardHeader 
        onNewProject={handleNewProject}
        onNewReview={handleNewReview}
      />
      <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
      {currentView === "grid" ? (
        <ProjectGrid
          projects={projects || []}
          onProjectReview={handleProjectReview}
          onProjectEdit={handleEditProject}
          onViewHistory={handleViewHistory}
        />
      ) : (
        <ProjectTable
          projects={projects || []}
          onProjectReview={handleProjectReview}
          onProjectEdit={handleEditProject}
          onViewHistory={handleViewHistory}
        />
      )}
      {selectedProject && (
        <ReviewSheet
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        onSubmit={refetch}
        project={projectToEdit || undefined}
      />
      <ProjectSelectionSheet
        projects={projects || []}
        isOpen={isProjectSelectionOpen}
        onClose={() => setIsProjectSelectionOpen(false)}
        onProjectSelect={handleProjectSelect}
      />
    </div>
  );
};

export default Index;