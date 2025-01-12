import { Table, TableBody } from "@/components/ui/table";
import { ProjectStatus, ProgressStatus } from "./ProjectCard";
import { useUser } from "@supabase/auth-helpers-react";
import { ProjectTableHeader } from "./project/ProjectTableHeader";
import { ProjectTableRow } from "./project/ProjectTableRow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";
import { useState } from "react";
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
}

interface ProjectTableProps {
  projects: Project[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
}

export const ProjectTable = ({
  projects,
  onProjectEdit,
  onViewHistory,
  onProjectDeleted,
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

  const { data: managerAssignments } = useQuery({
    queryKey: ["managerAssignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("manager_assignments")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("Manager assignments (table):", data);
      return data;
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");
  const isManager = userRoles?.some(role => role.role === "manager");

  // Filter projects for project managers and managers
  const filteredProjects = projects.filter(project => {
    if (!user) return false;
    if (isAdmin) return true;

    console.log("Checking project (table):", project.title);
    console.log("Project manager:", project.project_manager);
    console.log("User email:", user.email);
    
    // Si l'utilisateur est le chef de projet
    const isProjectManager = project.project_manager === user.email;
    
    // Si l'utilisateur est manager, vérifier les assignations
    const hasManagerAccess = isManager && managerAssignments?.some(assignment => {
      const hasPoleAccess = assignment.pole_id && project.pole_id === assignment.pole_id;
      const hasDirectionAccess = assignment.direction_id && project.direction_id === assignment.direction_id;
      const hasServiceAccess = assignment.service_id && project.service_id === assignment.service_id;
      
      console.log("Manager assignment check (table):", {
        hasPoleAccess,
        hasDirectionAccess,
        hasServiceAccess,
        assignment,
        projectPoleId: project.pole_id,
        projectDirectionId: project.direction_id,
        projectServiceId: project.service_id
      });

      return hasPoleAccess || hasDirectionAccess || hasServiceAccess;
    });

    console.log("Access check result (table):", {
      isProjectManager,
      hasManagerAccess,
      finalAccess: isProjectManager || hasManagerAccess
    });

    return isProjectManager || hasManagerAccess;
  });

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