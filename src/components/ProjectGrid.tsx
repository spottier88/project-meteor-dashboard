
import React, { useMemo, useState, useEffect } from 'react';
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
  const [isPermissionsLoaded, setIsPermissionsLoaded] = useState(false);
  const { userProfile, isAdmin, isManager, isProjectManager, isMember, highestRole, isLoading } = usePermissionsContext();
  
  useEffect(() => {
    if (!isLoading && !isPermissionsLoaded) {
      //console.log(`[ProjectGrid] Initial permissions loaded:`, {
      //  timestamp: new Date().toISOString(),
      //  projectsCount: projects.length,
      //  userEmail: userProfile?.email,
      //  isAdmin,
      //  isManager,
     //   isProjectManager,
     //   isMember,
     //   highestRole
     // });
      setIsPermissionsLoaded(true);
    }
  }, [isLoading, isPermissionsLoaded, userProfile?.email, isAdmin, isManager, isProjectManager, isMember, highestRole, projects.length]);

  const { data: projectMemberships } = useQuery({
    queryKey: ["projectMemberships", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[ProjectGrid] No user ID for memberships query");
        return [];
      }
      const { data, error } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("[ProjectGrid] Error fetching memberships:", error);
        return [];
      }

      return data.map(pm => pm.project_id);
    },
    enabled: !!user?.id && !isPermissionsLoaded,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);
  const { data: projectAccess } = useManagerProjectAccess(projectIds);

  const filteredProjects = useMemo(() => {
    if (!user) {
      console.log("[ProjectGrid] No user logged in");
      return [];
    }

    if (isAdmin) {
      return projects;
    }

    return projects.filter(project => {
      const isProjectOwner = project.project_manager === userProfile?.email;
      const isMemberOfProject = projectMemberships?.includes(project.id);
      const hasManagerAccess = isManager && projectAccess?.get(project.id) || false;
      
      return isProjectOwner || isMemberOfProject || hasManagerAccess;
    });
  }, [projects, user, isAdmin, userProfile?.email, projectMemberships, isManager, projectAccess]);

  React.useEffect(() => {
    if (onFilteredProjectsChange) {
      onFilteredProjectsChange(filteredProjects.map(project => project.id));
    }
  }, [filteredProjects, onFilteredProjectsChange]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
