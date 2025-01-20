import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectCard } from "@/components/ProjectCard";
import { MonitoringLevel } from "@/types/monitoring";
import { Project } from "@/types/user";
import { UserRoleData } from "@/types/user";

const Index = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("User roles:", data);
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_monitoring (
            monitoring_level,
            monitoring_entity_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });

  const handleProjectSubmit = async (projectData: {
    title: string;
    description: string;
    project_manager: string;
    start_date?: string;
    end_date?: string;
    priority: string;
    owner_id: string;
    pole_id: string | null;
    direction_id: string | null;
    service_id: string | null;
    monitoring_level: MonitoringLevel;
    monitoring_entity_id: string | null;
  }) => {
    if (selectedProject) {
      // Mise à jour d'un projet existant
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          title: projectData.title,
          description: projectData.description,
          project_manager: projectData.project_manager,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          priority: projectData.priority,
          owner_id: projectData.owner_id,
          pole_id: projectData.pole_id,
          direction_id: projectData.direction_id,
          service_id: projectData.service_id,
        })
        .eq('id', selectedProject.id);

      if (projectError) throw projectError;

      const { error: monitoringError } = await supabase
        .from('project_monitoring')
        .upsert({
          project_id: selectedProject.id,
          monitoring_level: projectData.monitoring_level,
          monitoring_entity_id: projectData.monitoring_entity_id,
        }, {
          onConflict: 'project_id'
        });

      if (monitoringError) throw monitoringError;
    } else {
      // Création d'un nouveau projet
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description,
          project_manager: projectData.project_manager,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          priority: projectData.priority,
          owner_id: projectData.owner_id,
          pole_id: projectData.pole_id,
          direction_id: projectData.direction_id,
          service_id: projectData.service_id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const { error: monitoringError } = await supabase
        .from('project_monitoring')
        .insert({
          project_id: newProject.id,
          monitoring_level: projectData.monitoring_level,
          monitoring_entity_id: projectData.monitoring_entity_id,
        });

      if (monitoringError) throw monitoringError;
    }

    // Rafraîchir la liste des projets
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    handleCloseProjectForm();
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsProjectFormOpen(true);
  };

  const handleCloseProjectForm = () => {
    setSelectedProject(null);
    setIsProjectFormOpen(false);
  };

  const isAdmin = userRoles?.some(ur => ur.role === 'admin');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Veuillez vous connecter pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes projets</h1>
        <Button onClick={() => setIsProjectFormOpen(true)}>
          Nouveau projet
        </Button>
      </div>

      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              lastReviewDate={project.last_review_date}
              onEdit={() => handleEditProject(project)}
              onReview={() => {}}
              onViewHistory={() => {}}
            />
          ))}
        </div>
      )}

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={handleCloseProjectForm}
        onSubmit={handleProjectSubmit}
        project={selectedProject || undefined}
      />
    </div>
  );
};

export default Index;