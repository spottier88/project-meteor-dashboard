
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAvailableProjects } from "@/hooks/usePortfolioProjects";
import { lifecycleStatusLabels } from "@/types/project";
import { StatusIcon } from "@/components/project/StatusIcon";

interface ProjectSelectorProps {
  onProjectsSelect: (projectIds: string[]) => void;
  excludePortfolioId?: string;
  selectedProjects: string[];
}

export const ProjectSelector = ({ 
  onProjectsSelect, 
  excludePortfolioId, 
  selectedProjects 
}: ProjectSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: projects, isLoading } = useAvailableProjects();

  const filteredProjects = projects?.filter(project => {
    // Exclure les projets déjà dans le portefeuille courant
    if (excludePortfolioId && project.portfolio_id === excludePortfolioId) {
      return false;
    }
    
    // Filtrer par terme de recherche
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_manager?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const handleProjectToggle = (projectId: string) => {
    const newSelection = selectedProjects.includes(projectId)
      ? selectedProjects.filter(id => id !== projectId)
      : [...selectedProjects, projectId];
    
    onProjectsSelect(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = filteredProjects.map(p => p.id);
    onProjectsSelect(allIds);
  };

  const handleDeselectAll = () => {
    onProjectsSelect([]);
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement des projets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher par nom de projet ou chef de projet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={handleSelectAll} size="sm">
          Tout sélectionner
        </Button>
        <Button variant="outline" onClick={handleDeselectAll} size="sm">
          Tout désélectionner
        </Button>
      </div>

      {selectedProjects.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium mb-2">
            {selectedProjects.length} projet{selectedProjects.length > 1 ? 's' : ''} sélectionné{selectedProjects.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="p-3 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedProjects.includes(project.id)}
                onCheckedChange={() => handleProjectToggle(project.id)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{project.title}</h4>
                    {project.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {project.project_manager || "Pas de chef de projet"}
                      </span>
                      {project.portfolio_id && (
                        <Badge variant="outline" className="text-xs">
                          Déjà dans un portefeuille
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    {project.status && (
                      <StatusIcon status={project.status} />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {lifecycleStatusLabels[project.lifecycle_status]}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun projet disponible
          </div>
        )}
      </div>
    </div>
  );
};
