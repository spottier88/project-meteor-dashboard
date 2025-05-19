
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, ListChecks, Info } from "lucide-react";
import { useProjectTemplates, ProjectTemplate } from "@/hooks/useProjectTemplates";
import { useTemplateSelection } from "@/hooks/useTemplateSelection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectFormStep5Props {
  onTemplateSelect: (templateId: string | null) => void;
  selectedTemplateId: string | null;
}

export const ProjectFormStep5: React.FC<ProjectFormStep5Props> = ({ 
  onTemplateSelect,
  selectedTemplateId
}) => {
  const { templates, isLoadingTemplates, getTemplateTasks } = useProjectTemplates();
  const [activeTemplates, setActiveTemplates] = useState<ProjectTemplate[]>([]);
  const [templateTasksCount, setTemplateTasksCount] = useState<Record<string, number>>({});

  useEffect(() => {
    // Filtrer les templates actifs
    if (templates) {
      const active = templates.filter(t => t.is_active);
      setActiveTemplates(active);
      
      // Récupérer le nombre de tâches pour chaque template
      active.forEach(async template => {
        try {
          const tasks = await getTemplateTasks(template.id);
          setTemplateTasksCount(prev => ({
            ...prev,
            [template.id]: tasks.length
          }));
        } catch (error) {
          console.error("Erreur lors du chargement des tâches:", error);
        }
      });
    }
  }, [templates, getTemplateTasks]);

  const handleTemplateChange = (value: string) => {
    onTemplateSelect(value || null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            <CardTitle>Modèle de projet (optionnel)</CardTitle>
          </div>
          <CardDescription>
            Sélectionnez un modèle pour préremplir les tâches de votre projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="template-select">Modèle de projet</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choisir un modèle créera automatiquement les tâches associées lors de la création du projet</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={selectedTemplateId || ""} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Sélectionnez un modèle (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun modèle</SelectItem>
                  {activeTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title} {templateTasksCount[template.id] > 0 && 
                        `(${templateTasksCount[template.id]} tâches)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isLoadingTemplates && (
                <p className="text-sm text-muted-foreground">Chargement des modèles...</p>
              )}
            </div>

            {selectedTemplateId && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="flex gap-2 items-center">
                  <Check className="h-5 w-5 text-green-500" />
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    Modèle sélectionné
                  </p>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Les {templateTasksCount[selectedTemplateId] || 0} tâches de ce modèle seront créées automatiquement avec votre projet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
