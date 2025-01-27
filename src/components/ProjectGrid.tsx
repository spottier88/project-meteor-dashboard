import React from 'react';
import { ProjectCard } from "./ProjectCard";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  lastReviewDate: string;
  project_manager?: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
  lifecycle_status: ProjectLifecycleStatus;
}

interface ProjectGridProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onFilteredProjectsChange?: (projectIds: string[]) => void;
}

export const ProjectGrid = ({
  onProjectReview,
  onProjectEdit,
  onViewHistory,
  onFilteredProjectsChange,
}: ProjectGridProps) => {
  const user = useUser();

  const { data: accessibleProjects } = useQuery({
    queryKey: ["accessibleProjects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .rpc('get_accessible_projects', {
          p_user_id: user.id
        });

      if (error) {
        console.error("Error fetching accessible projects:", error);
        return [];
      }

      return data;
    },
    enabled: !!user?.id,
  });

  React.useEffect(() => {
    if (accessibleProjects && onFilteredProjectsChange) {
      onFilteredProjectsChange(accessibleProjects.map(project => project.id));
    }
  }, [accessibleProjects, onFilteredProjectsChange]);

  if (!accessibleProjects) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accessibleProjects.map((project) => (
        <ProjectCard
          key={project.id}
          {...project}
          onReview={onProjectReview}
          onEdit={onProjectEdit}
          onViewHistory={onViewHistory}
        />
      ))}
    </div>
  );
};