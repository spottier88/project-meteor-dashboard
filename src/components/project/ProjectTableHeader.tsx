/**
 * @component ProjectTableHeader
 * @description En-tête de tableau pour la vue tabulaire des projets.
 * Gère les colonnes triables avec indication visuelle du tri actuel.
 * Permet de trier les projets par différents critères comme le titre,
 * le chef de projet, le statut, etc.
 */

import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";

interface ProjectTableHeaderProps {
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
}

export const ProjectTableHeader = ({
  currentSort,
  currentDirection,
  onSort,
}: ProjectTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <SortableHeader
          label="Nom du projet"
          sortKey="title"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Chef de projet"
          sortKey="project_manager"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Organisation"
          sortKey="pole_id"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Statut"
          sortKey="status"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="État d'avancement"
          sortKey="lifecycle_status"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Avancement"
          sortKey="completion"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Dernière revue"
          sortKey="last_review_date"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Niveau de suivi"
          sortKey="monitoring_level"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <TableHead className="text-center">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
