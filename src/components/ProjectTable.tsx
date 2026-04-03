
/**
 * @component ProjectTable
 * @description Composant purement présentatif pour l'affichage des projets en tableau.
 * Reçoit la liste finale des projets déjà filtrés par le parent et gère uniquement
 * le tri, la pagination et le rendu des lignes.
 */

import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { ProjectTableHeader } from "./project/ProjectTableHeader";
import { ProjectTableRow } from "./project/ProjectTableRow";
import { SortDirection } from "./ui/sortable-header";
import { ProjectListItem } from "@/hooks/useProjectsListView";
import { ProjectPagination } from "./project/ProjectPagination";

interface ProjectTableProps {
  projects: ProjectListItem[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const ProjectTable = ({
  projects,
  onProjectEdit,
  onViewHistory,
  onProjectDeleted,
  currentPage,
  pageSize,
  onPageChange,
}: ProjectTableProps) => {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

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

  // Tri local synchrone via useMemo
  const sortedProjects = React.useMemo(() => {
    if (!sortKey || !sortDirection) return projects;
    
    return [...projects].sort((a: any, b: any) => {
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
  }, [projects, sortKey, sortDirection]);

  // Paginer les projets après tri
  const paginatedProjects = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedProjects.slice(startIndex, endIndex);
  }, [sortedProjects, currentPage, pageSize]);

  // Calculer le nombre total de pages
  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil(sortedProjects.length / pageSize));
  }, [sortedProjects.length, pageSize]);

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
