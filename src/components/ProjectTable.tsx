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

interface Project {
  id: string;
  title: string;
  status: ProjectStatus | null;
  progress: ProgressStatus | null;
  completion: number;
  lastReviewDate: string | null;
  project_manager?: string;
  owner_id?: string;
  suivi_dgs?: boolean;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
  lifecycle_status: ProjectLifecycleStatus;
}

interface ProjectTableProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
  onFilteredProjectsChange?: (projectIds: string[]) => void;
}

export const ProjectTable = ({
  projects,
  onProjectEdit,
  onViewHistory,
  onProjectDeleted,
  onFilteredProjectsChange,
}: ProjectTableProps) => {
  const user = useUser();
  const { userProfile, userRoles, isAdmin } = usePermissionsContext();
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
        console.log("No user logged in");
        return [];
      }

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

  if (!filteredProjects) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <ProjectTableHeader
          currentSort={sortKey}
          currentDirection={sortDirection}
          onSort={handleSort}
        />
        <TableBody>
          {sortedProjects.map((project) => (
            <ProjectTableRow
              key={project.id}
              project={project}
              onProjectEdit={onProjectEdit}
              onViewHistory={onViewHistory}
              onProjectDeleted={onProjectDeleted}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};