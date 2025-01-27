import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectTableHeader } from "./project/ProjectTableHeader";
import { ProjectTableRow } from "./project/ProjectTableRow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";
import { useState, useEffect } from "react";
import { SortDirection } from "./ui/sortable-header";

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
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("User roles (table):", data);
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      console.log("User profile (table):", data);
      return data;
    },
    enabled: !!user?.id,
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
  });

  const { data: filteredProjects } = useQuery({
    queryKey: ["filteredProjects", projects, user?.id, userRoles, userProfile, projectMemberships],
    queryFn: async () => {
      if (!user) {
        console.log("No user logged in (table)");
        return [];
      }

      const isAdmin = userRoles?.some(role => role.role === "admin");
      if (isAdmin) {
        console.log("User is admin (table), showing all projects");
        return projects;
      }

      const filteredResults = await Promise.all(
        projects.map(async project => {
          const isProjectManager = project.project_manager === userProfile?.email;
          const isMember = projectMemberships?.includes(project.id);
          
          if (isProjectManager || isMember) {
            console.log(`Project ${project.id} accessible (project manager or member) (table)`);
            return true;
          }

          const { data: canAccess, error } = await supabase
            .rpc('can_manager_access_project', {
              p_user_id: user.id,
              p_project_id: project.id
            });

          if (error) {
            console.error("Error checking project access (table):", error);
            return false;
          }

          console.log(`Project ${project.id} - ${project.title} (table):`, {
            access: {
              isProjectManager,
              isMember,
              canAccess,
              userEmail: userProfile?.email,
              projectManager: project.project_manager
            },
            userRoles: userRoles?.map(r => r.role)
          });

          return canAccess;
        })
      );

      return projects.filter((_, index) => filteredResults[index]);
    },
    enabled: !!user?.id && !!userRoles && !!userProfile,
  });

  // Notifier le parent des IDs des projets filtrés
  useEffect(() => {
    if (filteredProjects && onFilteredProjectsChange) {
      const projectIds = filteredProjects.map(p => p.id);
      console.log("Notifying parent of filtered projects:", projectIds);
      onFilteredProjectsChange(projectIds);
    }
  }, [filteredProjects, onFilteredProjectsChange]);

  console.log("Filtered projects (table):", filteredProjects?.length || 0, "out of", projects.length);

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

  if (!filteredProjects) {
    return null;
  }

  const sortedProjects = [...filteredProjects].sort((a: any, b: any) => {
    if (!sortKey || !sortDirection) return 0;

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