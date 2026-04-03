
/**
 * @component ProjectGrid
 * @description Composant purement présentatif pour l'affichage des projets en grille.
 * Reçoit la liste finale des projets déjà filtrés par le parent et gère uniquement
 * la pagination et le rendu des cartes.
 */

import React, { useMemo } from 'react';
import { ProjectCard } from "./ProjectCard";
import { ProjectListItem } from '@/hooks/useProjectsListView';
import { ProjectPagination } from "./project/ProjectPagination";

interface ProjectGridProps {
  projects: ProjectListItem[];
  onProjectReview: (id: string, title: string) => void;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const ProjectGrid = ({
  projects,
  onProjectReview,
  onProjectEdit,
  onViewHistory,
  currentPage,
  pageSize,
  onPageChange,
}: ProjectGridProps) => {
  // Paginer les projets
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return projects.slice(startIndex, endIndex);
  }, [projects, currentPage, pageSize]);

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(projects.length / pageSize));
  }, [projects.length, pageSize]);

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
        Affichage de {Math.min(projects.length, (currentPage - 1) * pageSize + 1)} 
        {" - "}
        {Math.min(projects.length, currentPage * pageSize)} sur {projects.length} projets
      </div>
    </div>
  );
};
