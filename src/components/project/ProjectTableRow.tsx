import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Users } from "lucide-react";
import { Project } from "@/types/project";

export interface ProjectTableRowProps {
  project: Project;
  onProjectEdit: (id: string) => void;
  onViewHistory: (id: string) => void;
  onProjectDeleted: () => void;
  onTeamManagement: (projectId: string) => void;
}

export const ProjectTableRow = ({
  project,
  onProjectEdit,
  onViewHistory,
  onProjectDeleted,
  onTeamManagement,
}: ProjectTableRowProps) => {
  return (
    <TableRow>
      <TableCell>{project.title}</TableCell>
      <TableCell>{project.status}</TableCell>
      <TableCell>{project.progress}</TableCell>
      <TableCell>{project.completion}%</TableCell>
      <TableCell>{project.project_manager || "-"}</TableCell>
      <TableCell>
        {project.lastReviewDate
          ? new Date(project.lastReviewDate).toLocaleDateString("fr-FR")
          : "-"}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTeamManagement(project.id)}
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onProjectEdit(project.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};