
import React, { useMemo, useState, useEffect } from 'react';
import { ProjectCard } from "./ProjectCard";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useManagerProjectAccess } from "@/hooks/useManagerProjectAccess";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { ProjectListItem } from '@/hooks/useProjectsListView';
import { ProjectPagination } from "./project/ProjectPagination";

interface ProjectGridProps {
  projects: ProjectListItem[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onFilteredProjectsChange?: (projectIds: string[]) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const ProjectGrid = ({
  projects,
  onProjectReview,
  onProjectEdit,
  onViewHistory,
  onFilteredProjectsChange,
  currentPage,
  pageSize,
  onPageChange,
}: ProjectGridProps) => {
  const user = useUser();
  const [isPermissionsLoaded, setIsPermissionsLoaded] = useState(false);
  const { userProfile, isAdmin, isManager, isProjectManager, isMember, highestRole, isLoading } = usePermissionsContext();
  
  useEffect(() => {
    if (!isLoading && !isPermissionsLoaded) {
      setIsPermissionsLoaded(true);
    }
  }, [isLoading, isPermissionsLoaded, userProfile?.email, isAdmin, isManager, isProjectManager, isMember, highestRole, projects.length]);

  const { data: projectMemberships } = useQuery({
    queryKey: ["projectMemberships", user?.id],
    queryFn: async () => {
      if (!user?.id) {
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

  // Paginer les projets filtrés
  const paginatedProjects = useMemo(() => {
    if (!filteredProjects) {
      return [];
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, pageSize]);

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    if (!filteredProjects) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  }, [filteredProjects, pageSize]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            {...project}
            onReview={onProjectReview}
            onEdit={onProjectEdit}
            onViewHistory={onViewHistory}
          />
        ))}
      </div>

      {/* Composant de pagination */}
      <ProjectPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
      
      {/* Information sur le nombre de projets */}
      <div className="text-sm text-muted-foreground text-center">
        Affichage de {Math.min(filteredProjects.length, (currentPage - 1) * pageSize + 1)} 
        {" - "}
        {Math.min(filteredProjects.length, currentPage * pageSize)} sur {filteredProjects.length} projets
      </div>
    </div>
  );
};
