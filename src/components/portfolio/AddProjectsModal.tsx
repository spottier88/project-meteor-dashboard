
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusIcon } from "@/components/project/StatusIcon";
import { LifecycleStatusBadge } from "@/components/project/LifecycleStatusBadge";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAddProjectsToPortfolio } from "@/hooks/usePortfolioDetails";
import { ProjectStatus, ProjectLifecycleStatus } from "@/types/project";

interface Project {
  id: string;
  title: string;
  project_manager: string | null;
  status: ProjectStatus | null;
  lifecycle_status: ProjectLifecycleStatus;
  pole_id: string | null;
  direction_id: string | null;
  service_id: string | null;
  pole_name?: string | null;
  direction_name?: string | null;
  service_name?: string | null;
}

interface AddProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  excludeProjectIds: string[];
}

export const AddProjectsModal = ({ 
  isOpen, 
  onClose, 
  portfolioId, 
  excludeProjectIds 
}: AddProjectsModalProps) => {
  const addProjects = useAddProjectsToPortfolio();
  
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");

  // Récupérer les projets disponibles (non associés à un portefeuille)
  const { data: availableProjects, isLoading } = useQuery({
    queryKey: ["availableProjects", portfolioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          project_manager,
          status,
          lifecycle_status,
          pole_id,
          direction_id,
          service_id,
          poles:pole_id(name),
          directions:direction_id(name),
          services:service_id(name)
        `)
        .is("portfolio_id", null)
        .not("id", "in", `(${excludeProjectIds.join(",") || "''"})`);

      if (error) throw error;

      return data.map(project => ({
        ...project,
        pole_name: project.poles?.name || null,
        direction_name: project.directions?.name || null,
        service_name: project.services?.name || null,
      })) as Project[];
    },
    enabled: isOpen,
  });

  // Filtrage des projets
  const filteredProjects = availableProjects?.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_manager?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesLifecycle = lifecycleFilter === "all" || project.lifecycle_status === lifecycleFilter;
    
    let matchesOrganization = true;
    if (organizationFilter !== "all") {
      matchesOrganization = project.pole_name?.toLowerCase().includes(organizationFilter.toLowerCase()) ||
                           project.direction_name?.toLowerCase().includes(organizationFilter.toLowerCase()) ||
                           project.service_name?.toLowerCase().includes(organizationFilter.toLowerCase()) ||
                           false;
    }
    
    return matchesSearch && matchesStatus && matchesLifecycle && matchesOrganization;
  }) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(filteredProjects.map(p => p.id));
    } else {
      setSelectedProjectIds([]);
    }
  };

  const handleSelectProject = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds([...selectedProjectIds, projectId]);
    } else {
      setSelectedProjectIds(selectedProjectIds.filter(id => id !== projectId));
    }
  };

  const handleAddProjects = async () => {
    if (selectedProjectIds.length === 0) return;
    
    await addProjects.mutateAsync({
      portfolioId,
      projectIds: selectedProjectIds
    });
    
    setSelectedProjectIds([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedProjectIds([]);
    setSearchTerm("");
    setStatusFilter("all");
    setLifecycleFilter("all");
    setOrganizationFilter("all");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter des projets au portefeuille</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
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
            <Input
              placeholder="Organisation..."
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="w-full lg:w-48"
            />
          </div>

          {/* Résultats */}
          <div className="text-sm text-muted-foreground">
            {filteredProjects.length} projet(s) disponible(s) • {selectedProjectIds.length} sélectionné(s)
          </div>

          {/* Tableau */}
          <div className="border rounded-md flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Chargement des projets...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredProjects.length > 0 && selectedProjectIds.length === filteredProjects.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead>Chef de projet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Cycle de vie</TableHead>
                    <TableHead>Organisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun projet disponible
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProjectIds.includes(project.id)}
                            onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>{project.project_manager || "-"}</TableCell>
                        <TableCell>
                          <StatusIcon status={project.status} />
                        </TableCell>
                        <TableCell>
                          <LifecycleStatusBadge status={project.lifecycle_status} />
                        </TableCell>
                        <TableCell>
                          {[project.pole_name, project.direction_name, project.service_name]
                            .filter(Boolean)
                            .join(" > ") || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddProjects}
              disabled={selectedProjectIds.length === 0 || addProjects.isLoading}
            >
              {addProjects.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter {selectedProjectIds.length > 0 && `(${selectedProjectIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
