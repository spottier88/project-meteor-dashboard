
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectTableHeader } from "./project/ProjectTableHeader";
import { ProjectTableRow } from "./project/ProjectTableRow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SortDirection } from "./ui/sortable-header";
import { useManagerProjectAccess } from "@/hooks/use-manager-project-access";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { ProjectListItem } from "@/hooks/use-projects-list-view";
import { ProjectPagination } from "./project/ProjectPagination";

interface ProjectTableProps {
  projects: ProjectListItem[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
  onFilteredProjectsChange?: (projectIds: string[]) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const ProjectTable = ({
  projects,
  onProjectEdit,
  onViewHistory,
  onProjectDeleted,
  onFilteredProjectsChange,
  currentPage,
  pageSize,
  onPageChange,
}: ProjectTableProps) => {
  const user = useUser();
  const { userProfile, userRoles, isAdmin, isLoading } = usePermissionsContext();
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

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
        return [];
      }

      if (isAdmin) {
        return projects;
      }

      return projects.filter(project => {
        const isProjectManager = project.project_manager === userProfile?.email;
        const isMember = projectMemberships?.includes(project.id);
        const hasManagerAccess = projectAccess?.get(project.id) || false;
        
        return isProjectManager || isMember || hasManagerAccess;
      });
    },
    enabled: !!user?.id && !!userRoles && !!userProfile && !!projectAccess && !isLoading,
    staleTime: 300000, // 5 minutes
  });

  React.useEffect(() => {
    if (filteredProjects && onFilteredProjectsChange) {
      onFilteredProjectsChange(filteredProjects.map(project => project.id));
    }
  }, [filteredProjects, onFilteredProjectsChange]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => {
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedProjects = React.useMemo(() => {
    if (!filteredProjects) return [];
    if (!sortKey || !sortDirection) return filteredProjects;
    
    return [...filteredProjects].sort((a: any, b: any) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredProjects, sortKey, sortDirection]);

  // Paginer les projets après tri
  const paginatedProjects = React.useMemo(() => {
    if (!sortedProjects) return [];
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedProjects.slice(startIndex, endIndex);
  }, [sortedProjects, currentPage, pageSize]);

  // Calculer le nombre total de pages
  const totalPages = React.useMemo(() => {
    if (!sortedProjects) return 1;
    return Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  }, [sortedProjects, pageSize]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (!filteredProjects) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <ProjectTableHeader
            currentSort={sortKey}
            currentDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {paginatedProjects.map((project) => (
              <ProjectTableRow
                key={project.id}
                project={{
                  ...project,
                  weather: project.weather || project.status,
                  progress: project.review_progress || project.progress,
                  lastReviewDate: project.review_created_at || project.last_review_date
                }}
                onProjectEdit={onProjectEdit}
                onViewHistory={onViewHistory}
                onProjectDeleted={onProjectDeleted}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Composant de pagination */}
      <ProjectPagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
      
      {/* Information sur le nombre de projets */}
      <div className="text-sm text-muted-foreground text-center">
        Affichage de {Math.min(sortedProjects.length, (currentPage - 1) * pageSize + 1)} 
        {" - "}
        {Math.min(sortedProjects.length, currentPage * pageSize)} sur {sortedProjects.length} projets
      </div>
    </div>
  );
};
