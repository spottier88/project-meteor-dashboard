import React from 'react';
import { ProjectCard } from "./ProjectCard";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";
import { useManagerProjectAccess } from "@/hooks/use-manager-project-access";

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
  projects,
  onProjectReview,
  onProjectEdit,
  onViewHistory,
  onFilteredProjectsChange,
}: ProjectGridProps) => {
  const user = useUser();

  // Optimisation : utilisation de staleTime pour réduire les requêtes
  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const { data: projectMemberships } = useQuery({
    queryKey: ["projectMemberships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching project memberships:", error);
        return [];
      }

      return data.map(pm => pm.project_id);
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const projectIds = React.useMemo(() => projects.map(p => p.id), [projects]);
  const { data: projectAccess } = useManagerProjectAccess(projectIds);

  const { data: filteredProjects } = useQuery({
    queryKey: ["filteredProjects", projectIds, user?.id, userRoles, userProfile, projectMemberships, projectAccess],
    queryFn: async () => {
      if (!user) {
        console.log("No user logged in");
        return [];
      }

      const isAdmin = userRoles?.some(role => role.role === "admin");
      if (isAdmin) {
        console.log("User is admin, showing all projects");
        return projects;
      }

      return projects.filter(project => {
        const isProjectManager = project.project_manager === userProfile?.email;
        const isMember = projectMemberships?.includes(project.id);
        const hasManagerAccess = projectAccess?.get(project.id) || false;
        
        return isProjectManager || isMember || hasManagerAccess;
      });
    },
    enabled: !!user?.id && !!userRoles && !!userProfile && !!projectAccess,
    staleTime: 300000, // 5 minutes
  });

  React.useEffect(() => {
    if (filteredProjects && onFilteredProjectsChange) {
      onFilteredProjectsChange(filteredProjects.map(project => project.id));
    }
  }, [filteredProjects, onFilteredProjectsChange]);

  if (!filteredProjects) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
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