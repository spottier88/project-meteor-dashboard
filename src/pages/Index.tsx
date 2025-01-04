import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ViewToggle } from "@/components/ViewToggle";

const Index = () => {
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [view, setView] = useState<"grid" | "table">("grid");
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
      return data;
    },
  });

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setIsProjectFormOpen(true);
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
        user={user}
      />

      <div className="mb-6">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "grid" ? (
        <ProjectGrid projects={projects || []} onEdit={handleEditProject} />
      ) : (
        <ProjectTable projects={projects || []} onEdit={handleEditProject} />
      )}

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