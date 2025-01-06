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
      return data as UserRoleData[];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(role => role.role === "admin");

  // Filter projects for project managers
  const filteredProjects = projects.filter(project => {
    if (!user) return false;
    if (isAdmin) return true;
    return project.project_manager === user.email;
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