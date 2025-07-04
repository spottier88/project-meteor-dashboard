
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StatusIcon } from "./StatusIcon";
import { ProjectActions } from "./ProjectActions";
import { OrganizationCell } from "./OrganizationCell";
import { useProjectNavigation } from "@/hooks/useProjectNavigation";
import { useNavigate } from "react-router-dom";

interface ProjectTableRowProps {
  project: any;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onInvite?: (projectId: string) => void;
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canInvite?: boolean;
  };
}

export const ProjectTableRow = ({ 
  project, 
  onEdit, 
  onDelete, 
  onInvite,
  permissions = {}
}: ProjectTableRowProps) => {
  const navigate = useNavigate();
  const { navigateToProject } = useProjectNavigation();

  const handleRowClick = (e: React.MouseEvent) => {
    // Éviter la navigation si on clique sur des boutons d'action
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="button"]')) {
      return;
    }
    navigateToProject(project.id, navigate);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'haute':
      case 'high':
        return 'destructive';
      case 'moyenne':
      case 'medium':
        return 'secondary';
      case 'basse':
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLifecycleLabel = (status?: string) => {
    switch (status) {
      case 'study': return 'Étude';
      case 'development': return 'Développement';
      case 'production': return 'Production';
      case 'maintenance': return 'Maintenance';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={handleRowClick}
    >
      <TableCell className="font-medium">
        <div>
          <div className="font-semibold">{project.title}</div>
          {project.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {project.description}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        {project.weather && (
          <div className="flex items-center gap-2">
            <StatusIcon status={project.weather} />
            <span className="text-sm">{project.weather}</span>
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {project.completion !== undefined ? (
          <Badge variant="outline">
            {project.completion}%
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      
      <TableCell>
        <OrganizationCell project={project} />
      </TableCell>
      
      <TableCell>
        <div className="space-y-1">
          {project.priority && (
            <Badge variant={getPriorityColor(project.priority)} className="text-xs">
              {project.priority}
            </Badge>
          )}
          {project.lifecycle_status && (
            <Badge variant="secondary" className="text-xs">
              {getLifecycleLabel(project.lifecycle_status)}
            </Badge>
          )}
          {project.suivi_dgs && (
            <Badge variant="default" className="text-xs bg-blue-500">
              Suivi DGS
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        {project.project_manager_name || project.project_manager || (
          <span className="text-muted-foreground">Non assigné</span>
        )}
      </TableCell>
      
      <TableCell>
        {project.last_review_date ? (
          format(new Date(project.last_review_date), "dd/MM/yyyy", { locale: fr })
        ) : (
          <span className="text-muted-foreground">Jamais</span>
        )}
      </TableCell>
      
      <TableCell>
        <ProjectActions
          projectId={project.id}
          onEdit={onEdit}
          onDelete={onDelete}
          onInvite={onInvite}
          permissions={permissions}
        />
      </TableCell>
    </TableRow>
  );
};
