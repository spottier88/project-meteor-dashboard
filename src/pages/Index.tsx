import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { ProjectFilters } from "@/components/ProjectFilters";

const Index = () => {
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState({
    showDgsOnly: false,
    organization: null as { type: string; id: string } | null,
    projectManager: null as string | null,
  });
  
  const user = useUser();

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
    // Filter by DGS follow-up
    if (filters.showDgsOnly && !project.suivi_dgs) {
      return false;
    }

    // Filter by organization
    if (filters.organization) {
      const { type, id } = filters.organization;
      switch (type) {
        case "pole":
          if (project.pole_id !== id) return false;
          break;
        case "direction":
          if (project.direction_id !== id) return false;
          break;
        case "service":
          if (project.service_id !== id) return false;
          break;
      }
    }

    // Filter by project manager
    if (filters.projectManager && project.project_manager !== filters.projectManager) {
      return false;
    }

    return true;
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

  return (
    <div className="container mx-auto py-8">
      <DashboardHeader
        onNewProject={() => setIsProjectFormOpen(true)}
        onNewReview={() => {}}
      />

      <div className="space-y-4">
        <ViewToggle currentView={view} onViewChange={setView} />
        
        <ProjectFilters
          onFilterChange={setFilters}
        />

        {view === "grid" ? (
          <ProjectGrid 
            projects={filteredProjects || []} 
            onProjectEdit={handleEditProject}
            onProjectReview={() => {}}
            onViewHistory={() => {}}
          />
        ) : (
          <ProjectTable 
            projects={filteredProjects || []} 
            onProjectEdit={handleEditProject}
            onProjectReview={() => {}}
            onViewHistory={() => {}}
            onProjectDeleted={refetchProjects}
          />
        )}
      </div>

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={handleProjectFormClose}
        onSubmit={handleProjectFormSubmit}
        project={selectedProject}
      />
    </div>
  );
};

export default Index;