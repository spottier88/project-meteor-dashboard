
/**
 * @file PortfolioProjectsTable.tsx
 * @description Tableau listant les projets d'un portefeuille avec filtres,
 * tri et actions (export, présentation, Gantt).
 */

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { StatusIcon } from "@/components/project/StatusIcon";
import { LifecycleStatusBadge } from "@/components/project/LifecycleStatusBadge";
import { Search, Eye, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRemoveProjectFromPortfolio } from "@/hooks/usePortfolioDetails";
import { useProjectNavigation } from "@/hooks/useProjectNavigation";
import { ProjectStatus, ProjectLifecycleStatus } from "@/types/project";
import { SortableHeader, SortDirection } from "@/components/ui/sortable-header";
import { PortfolioProjectsActions } from "./PortfolioProjectsActions";
import { usePortfolioPermissions } from "@/hooks/usePortfolioPermissions";

interface Project {
  id: string;
  title: string;
  project_manager: string | null;
  status: ProjectStatus | null;
  progress: string | null;
  start_date: string | null;
  end_date: string | null;
  lifecycle_status: ProjectLifecycleStatus;
  priority: string | null;
  created_at: string | null;
  completion: number; // Ajout de la propriété completion
}

interface PortfolioProjectsTableProps {
  projects: Project[];
  portfolioId: string;
  onAddProjects: () => void;
}

export const PortfolioProjectsTable = ({ 
  projects, 
  portfolioId, 
  onAddProjects 
}: PortfolioProjectsTableProps) => {
  const removeProject = useRemoveProjectFromPortfolio();
  const { navigateToProject } = useProjectNavigation();
  const { canManagePortfolios } = usePortfolioPermissions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [projectToRemove, setProjectToRemove] = useState<string | null>(null);

  // Filtrage des projets
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_manager?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesLifecycle = lifecycleFilter === "all" || project.lifecycle_status === lifecycleFilter;
    
    return matchesSearch && matchesStatus && matchesLifecycle;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;
    
    let aValue = a[sortKey as keyof Project];
    let bValue = b[sortKey as keyof Project];
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : 1;
    } else {
      return aValue > bValue ? -1 : 1;
    }
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleRemoveProject = async () => {
    if (projectToRemove) {
      await removeProject.mutateAsync({ projectId: projectToRemove });
      setProjectToRemove(null);
    }
  };

  const handleProjectClick = (projectId: string, event: React.MouseEvent) => {
    event.preventDefault();
    navigateToProject(projectId, event);
  };

  return (
    <div className="space-y-4">
      {/* En-tête et actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Projets du portefeuille</h3>
            <p className="text-sm text-muted-foreground">
              {filteredProjects.length} projet(s) sur {projects.length}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Boutons d'actions (export, présentation, Gantt) */}
            <PortfolioProjectsActions
              portfolioId={portfolioId}
              projectIds={projects.map(p => p.id)}
              canManage={canManagePortfolios}
            />
            {/* Bouton d'ajout de projets */}
            <Button onClick={onAddProjects} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des projets
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de projet ou chef de projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="sunny">Ensoleillé</SelectItem>
            <SelectItem value="cloudy">Nuageux</SelectItem>
            <SelectItem value="stormy">Orageux</SelectItem>
          </SelectContent>
        </Select>
        <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Cycle de vie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les cycles</SelectItem>
            <SelectItem value="study">À l'étude</SelectItem>
            <SelectItem value="validated">Validé</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
            <SelectItem value="abandoned">Abandonné</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="Projet"
                sortKey="title"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Chef de projet"
                sortKey="project_manager"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHead>Statut</TableHead>
              <TableHead>Cycle de vie</TableHead>
              <SortableHeader
                label="Avancement"
                sortKey="completion"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Priorité"
                sortKey="priority"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Date de début"
                sortKey="start_date"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Date de fin"
                sortKey="end_date"
                currentSort={sortKey}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {projects.length === 0 
                    ? "Aucun projet dans ce portefeuille" 
                    : "Aucun projet ne correspond aux filtres"}
                </TableCell>
              </TableRow>
            ) : (
              sortedProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <button 
                      onClick={(e) => handleProjectClick(project.id, e)}
                      className="hover:underline text-primary text-left w-full"
                    >
                      {project.title}
                    </button>
                  </TableCell>
                  <TableCell>{project.project_manager || "-"}</TableCell>
                  <TableCell>
                    <StatusIcon status={project.status} />
                  </TableCell>
                  <TableCell>
                    <LifecycleStatusBadge status={project.lifecycle_status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(project.completion || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{project.completion || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.priority ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : project.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {project.priority === 'high' ? 'Haute' : 
                         project.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {project.start_date 
                      ? format(new Date(project.start_date), "dd/MM/yyyy", { locale: fr })
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    {project.end_date 
                      ? format(new Date(project.end_date), "dd/MM/yyyy", { locale: fr })
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleProjectClick(project.id, e)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProjectToRemove(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!projectToRemove} onOpenChange={() => setProjectToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le projet du portefeuille</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer ce projet du portefeuille ? 
              Le projet ne sera pas supprimé, il sera simplement désassocié du portefeuille.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveProject}>
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
