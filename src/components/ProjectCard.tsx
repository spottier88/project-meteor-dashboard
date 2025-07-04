
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, Building2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";  
import { ProjectCardHeader } from "./project/ProjectCardHeader";
import { StatusIcon } from "./project/StatusIcon";
import { useProjectNavigation } from "@/hooks/useProjectNavigation";
import { useNavigate } from "react-router-dom";
import { ProjectStatus } from "@/types/project";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description?: string;
    status?: string;
    weather?: string;
    progress?: string;
    completion?: number;
    last_review_date?: string;
    project_manager?: string;
    project_manager_name?: string;
    pole_name?: string;
    direction_name?: string;
    service_name?: string;
    priority?: string;
    lifecycle_status?: string;
    suivi_dgs?: boolean;
  };
  onEdit?: (projectId: string) => void;
}

export const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const navigate = useNavigate();
  const { navigateToProject } = useProjectNavigation();

  const handleCardClick = (e: React.MouseEvent) => {
    // Éviter la navigation si on clique sur des boutons d'action
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigateToProject(project.id, navigate);
  };

  const getOrganizationDisplay = () => {
    const parts = [];
    if (project.pole_name) parts.push(project.pole_name);
    if (project.direction_name) parts.push(project.direction_name);
    if (project.service_name) parts.push(project.service_name);
    return parts.join(" > ");
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

  // Fonction pour convertir le weather en ProjectStatus
  const getProjectStatus = (weather?: string): ProjectStatus | null => {
    if (!weather) return null;
    if (weather === 'sunny' || weather === 'cloudy' || weather === 'stormy') {
      return weather as ProjectStatus;
    }
    return null;
  };

  return (
    <Card 
      className="h-full cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <StatusIcon status={getProjectStatus(project.weather)} className="h-6 w-6 shrink-0" />
            <h2 className="text-xl font-semibold truncate max-w-[240px] md:max-w-xs">{project.title}</h2>
          </div>
          {onEdit && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project.id);
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ⋮
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {project.weather && (
            <div className="flex items-center gap-1">
              <StatusIcon status={getProjectStatus(project.weather)} />
              <span className="text-xs text-muted-foreground">
                {project.weather}
              </span>
            </div>
          )}
          
          {project.completion !== undefined && (
            <Badge variant="outline" className="text-xs">
              {project.completion}% terminé
            </Badge>
          )}
          
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

        {project.project_manager_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{project.project_manager_name}</span>
          </div>
        )}

        {getOrganizationDisplay() && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>{getOrganizationDisplay()}</span>
          </div>
        )}

        {project.last_review_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span>
              Dernière revue : {format(new Date(project.last_review_date), "dd/MM/yyyy", { locale: fr })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
