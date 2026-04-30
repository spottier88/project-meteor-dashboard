
/**
 * @component ProjectList
 * @description Composant principal pour l'affichage des listes de projets.
 * Gère la bascule entre les vues grille et tableau, et transmet les projets
 * et les actions (édition, revue, historique) aux composants enfants.
 * 
 * Ce composant est purement présentatif : il reçoit la liste finale de projets
 * déjà filtrés et ne remonte aucun état au parent.
 */

import { useState, useEffect, useRef } from "react";
import { ViewMode } from "@/components/ViewToggle";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectTable } from "@/components/ProjectTable";
import { ViewToggle } from "@/components/ViewToggle";
import { ProjectListItem } from "@/hooks/useProjectsListView";

interface ProjectListProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  projects: ProjectListItem[];
  onProjectEdit: (id: string) => void;
  onProjectReview: (id: string, title: string) => void;
  onViewHistory: (id: string, title: string) => void;
  onProjectDeleted: () => void;
}

export const ProjectList = ({
  view,
  onViewChange,
  projects,
  onProjectEdit,
  onProjectReview,
  onViewHistory,
  onProjectDeleted,
}: ProjectListProps) => {
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(localStorage.getItem("projectsCurrentPage") || "1");
  });
  const [pageSize, setPageSize] = useState(() => {
    return parseInt(localStorage.getItem("projectsPageSize") || "10");
  });

  // Remise à la première page uniquement lors d'un changement de filtre (pas au premier rendu)
  const isFirstRender = useRef(true);
  const prevLength = useRef(projects.length);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevLength.current = projects.length;
      return;
    }
    if (prevLength.current !== projects.length) {
      setCurrentPage(1);
      prevLength.current = projects.length;
    }
  }, [projects.length]);

  // Sauvegarde des préférences de pagination
  useEffect(() => {
    localStorage.setItem("projectsCurrentPage", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("projectsPageSize", pageSize.toString());
  }, [pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ViewToggle 
          currentView={view} 
          onViewChange={onViewChange} 
          availableViews={["grid", "table"]}
        />
      </div>
      {view === "grid" ? (
        <ProjectGrid
          projects={projects}
          onProjectEdit={onProjectEdit}
          onProjectReview={onProjectReview}
          onViewHistory={onViewHistory}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      ) : (
        <ProjectTable
          projects={projects}
          onProjectReview={onProjectReview}
          onProjectEdit={onProjectEdit}
          onViewHistory={onViewHistory}
          onProjectDeleted={onProjectDeleted}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
