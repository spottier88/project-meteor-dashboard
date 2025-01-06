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
          label="Progression"
          sortKey="progress"
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
          label="Suivi DGS"
          sortKey="suivi_dgs"
          currentSort={currentSort}
          currentDirection={currentDirection}
          onSort={onSort}
        />
        <TableHead className="text-center">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};