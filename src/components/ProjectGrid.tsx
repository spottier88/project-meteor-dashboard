import React from 'react';
import { ProjectCard } from "./ProjectCard";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useManagerProjectAccess } from "@/hooks/use-manager-project-access";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

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
  const { userProfile, isAdmin, isManager, isProjectManager, isMember, hasRole, highestRole, isLoading } = usePermissionsContext();

  console.log("ProjectGrid - Current user:", {
    id: user?.id,
    email: user?.email,
    userProfile,
  });

  console.log("ProjectGrid - Permissions state:", {
    userProfile,
    isAdmin,
    isManager,
    isProjectManager,
    isMember,
    highestRole,
    isLoading,
    userId: user?.id
  });

  const { data: projectMemberships } = useQuery({
    queryKey: ["projectMemberships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log("Fetching project memberships for user:", user.id);
      const { data, error } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching project memberships:", error);
        return [];
      }

      console.log("Fetched project memberships:", data);
      return data.map(pm => pm.project_id);
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const projectIds = React.useMemo(() => projects.map(p => p.id), [projects]);
  const { data: projectAccess } = useManagerProjectAccess(projectIds);

  const { data: filteredProjects } = useQuery({
    queryKey: ["filteredProjects", projectIds, user?.id, highestRole, projectMemberships, projectAccess, isAdmin],
    queryFn: async () => {
      if (!user) {
        console.log("No user logged in");
        return [];
      }

      console.log("Filtering projects with params:", {
        isAdmin,
        isManager,
        isProjectManager,
        highestRole,
        projectMemberships,
        projectAccess,
        totalProjects: projects.length,
        userEmail: userProfile?.email
      });

      // Admin voit tout
      if (isAdmin) {
        console.log("User is admin, showing all projects:", projects.length);
        return projects;
      }

      const filtered = projects.filter(project => {
        // Chef de projet voit ses projets
        const isProjectOwner = project.project_manager === userProfile?.email;
        // Membre voit les projets où il est membre
        const isMemberOfProject = projectMemberships?.includes(project.id);
        // Manager voit les projets de son périmètre
        const hasManagerAccess = isManager && projectAccess?.get(project.id) || false;
        
        console.log(`Project ${project.id} access check:`, {
          isProjectOwner,
          isMemberOfProject,
          hasManagerAccess,
          userEmail: userProfile?.email,
          projectManager: project.project_manager,
          highestRole
        });

        return isProjectOwner || isMemberOfProject || hasManagerAccess;
      });

      console.log("Filtered projects result:", filtered.length);
      return filtered;
    },
    enabled: !!user?.id && !isLoading,
  });

  React.useEffect(() => {
    if (filteredProjects && onFilteredProjectsChange) {
      onFilteredProjectsChange(filteredProjects.map(project => project.id));
    }
  }, [filteredProjects, onFilteredProjectsChange]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

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