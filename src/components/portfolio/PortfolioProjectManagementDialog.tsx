
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { Portfolio } from "@/types/portfolio";
import { ProjectSelector } from "./ProjectSelector";
import { 
  usePortfolioProjects, 
  useAddProjectToPortfolio, 
  useRemoveProjectFromPortfolio 
} from "@/hooks/usePortfolioProjects";
import { lifecycleStatusLabels } from "@/types/project";
import { StatusIcon } from "@/components/project/StatusIcon";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

interface PortfolioProjectManagementDialogProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio | null;
}

export const PortfolioProjectManagementDialog = ({ 
  open, 
  onClose, 
  portfolio 
}: PortfolioProjectManagementDialogProps) => {
  const [selectedProjectsToAdd, setSelectedProjectsToAdd] = useState<string[]>([]);
  const [selectedProjectsToRemove, setSelectedProjectsToRemove] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("current");
  
  const { isAdmin, hasRole } = usePermissionsContext();
  const canManage = isAdmin || hasRole('portfolio_manager');

  const { data: portfolioProjects, isLoading } = usePortfolioProjects(portfolio?.id || "");
  const addMutation = useAddProjectToPortfolio();
  const removeMutation = useRemoveProjectFromPortfolio();

  const handleAddProjects = async () => {
    if (!portfolio || selectedProjectsToAdd.length === 0) return;
    
    await addMutation.mutateAsync({
      projectIds: selectedProjectsToAdd,
      portfolioId: portfolio.id
    });
    
    setSelectedProjectsToAdd([]);
    setActiveTab("current");
  };

  const handleRemoveProjects = async () => {
    if (selectedProjectsToRemove.length === 0) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir retirer ${selectedProjectsToRemove.length} projet(s) de ce portefeuille ?`)) {
      await removeMutation.mutateAsync(selectedProjectsToRemove);
      setSelectedProjectsToRemove([]);
    }
  };

  const handleProjectRemoveToggle = (projectId: string) => {
    setSelectedProjectsToRemove(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  if (!portfolio) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gestion des projets - {portfolio.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">
              Projets actuels ({portfolioProjects?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="add">
              Ajouter des projets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6">
            <div className="space-y-4">
              {canManage && selectedProjectsToRemove.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedProjectsToRemove.length} projet(s) sélectionné(s) pour suppression
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveProjects}
                    disabled={removeMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Retirer du portefeuille
                  </Button>
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-8">Chargement des projets...</div>
              ) : portfolioProjects && portfolioProjects.length > 0 ? (
                <div className="space-y-3">
                  {portfolioProjects.map((project) => (
                    <Card key={project.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {canManage && (
                          <Checkbox
                            checked={selectedProjectsToRemove.includes(project.id)}
                            onCheckedChange={() => handleProjectRemoveToggle(project.id)}
                            className="mt-1"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{project.title}</h3>
                              {project.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              {project.status && (
                                <StatusIcon status={project.status} />
                              )}
                              <Badge variant="outline">
                                {lifecycleStatusLabels[project.lifecycle_status]}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <span>Chef de projet: {project.project_manager || "Non assigné"}</span>
                            {project.start_date && (
                              <span>Début: {new Date(project.start_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun projet dans ce portefeuille
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            {canManage ? (
              <div className="space-y-4">
                <ProjectSelector
                  onProjectsSelect={setSelectedProjectsToAdd}
                  excludePortfolioId={portfolio.id}
                  selectedProjects={selectedProjectsToAdd}
                />
                
                {selectedProjectsToAdd.length > 0 && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProjectsToAdd([])}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddProjects}
                      disabled={addMutation.isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter {selectedProjectsToAdd.length} projet(s)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Vous n'avez pas les permissions pour ajouter des projets à ce portefeuille.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
