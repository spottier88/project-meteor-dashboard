
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, PlusCircle, Pencil, Trash2, ArrowLeft, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjectTemplates, ProjectTemplate, ProjectTemplateTask } from "@/hooks/useProjectTemplates";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { TemplateTaskList } from "@/components/templates/TemplateTaskList";
import { Badge } from "@/components/ui/badge";

export const ProjectTemplateManagement = () => {
  const navigate = useNavigate();
  const { 
    templates,
    isLoadingTemplates,
    getTemplateWithTasks,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useProjectTemplates();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ProjectTemplate | undefined>(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateTasks, setSelectedTemplateTasks] = useState<ProjectTemplateTask[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string, title: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplateTasks = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateTasks([]);
      return;
    }

    setIsLoading(true);
    try {
      const { tasks } = await getTemplateWithTasks(templateId);
      setSelectedTemplateTasks(tasks);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      setSelectedTemplateTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateTasks(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  const filteredTemplates = templates.filter(template => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return template.is_active;
    if (activeTab === "inactive") return !template.is_active;
    return true;
  });

  const handleAddTemplate = () => {
    setCurrentTemplate(undefined);
    setIsFormOpen(true);
  };

  const handleEditTemplate = (template: ProjectTemplate) => {
    setCurrentTemplate(template);
    setIsFormOpen(true);
  };

  const handleDeleteTemplate = (template: ProjectTemplate) => {
    setTemplateToDelete({ id: template.id, title: template.title });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    await deleteTemplate.mutateAsync(templateToDelete.id);
    
    setIsDeleteDialogOpen(false);
    setTemplateToDelete(null);
    
    // Si le template supprimé était sélectionné, réinitialiser la sélection
    if (selectedTemplateId === templateToDelete.id) {
      setSelectedTemplateId(null);
      setSelectedTemplateTasks([]);
    }
  };

  const handleTemplateSubmit = async (templateData: Partial<ProjectTemplate>) => {
    if (currentTemplate) {
      await updateTemplate.mutateAsync({
        id: currentTemplate.id,
        title: templateData.title as string,
        description: templateData.description,
        is_active: templateData.is_active
      });
    } else {
      await createTemplate.mutateAsync({
        title: templateData.title as string,
        description: templateData.description
      });
    }
    
    setIsFormOpen(false);
  };

  const handleTasksChanged = () => {
    if (selectedTemplateId) {
      loadTemplateTasks(selectedTemplateId);
    }
  };

  const selectTemplate = (templateId: string) => {
    // Si on clique sur le template déjà sélectionné, on le désélectionne
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
      setSelectedTemplateTasks([]);
    } else {
      setSelectedTemplateId(templateId);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Modèles de projet</h1>
        <p className="text-muted-foreground">
          Gérez les modèles de projet pour prédéfinir les tâches lors de la création de projets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Liste des modèles */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Modèles</h2>
            <Button onClick={handleAddTemplate} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="active">Actifs</TabsTrigger>
              <TabsTrigger value="inactive">Inactifs</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            {isLoadingTemplates ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center p-6 border rounded-md">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun modèle {activeTab === "active" ? "actif" : activeTab === "inactive" ? "inactif" : ""} trouvé.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer hover:shadow transition-shadow ${
                      selectedTemplateId === template.id ? 'border-primary' : ''
                    }`}
                    onClick={() => selectTemplate(template.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <div className="flex gap-1">
                          {!template.is_active && (
                            <Badge variant="outline">Inactif</Badge>
                          )}
                        </div>
                      </div>
                      {template.description && (
                        <CardDescription className="text-sm line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Détail du modèle et ses tâches */}
        <div className="md:col-span-2">
          {selectedTemplateId ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ListChecks className="h-6 w-6 mr-2" />
                        {templates.find(t => t.id === selectedTemplateId)?.title}
                      </div>
                      {!templates.find(t => t.id === selectedTemplateId)?.is_active && (
                        <Badge variant="outline">Inactif</Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {templates.find(t => t.id === selectedTemplateId)?.description || 
                     "Aucune description fournie"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <TemplateTaskList
                      templateId={selectedTemplateId}
                      tasks={selectedTemplateTasks}
                      onTasksChanged={handleTasksChanged}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] border rounded-lg p-6">
              <Settings className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-xl font-medium mb-2">Sélectionnez un modèle</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Choisissez un modèle dans la liste pour voir et gérer ses tâches associées.
              </p>
            </div>
          )}
        </div>
      </div>

      <TemplateForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleTemplateSubmit}
        template={currentTemplate}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le modèle</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le modèle "{templateToDelete?.title}" ?
              Cette action supprimera également toutes les tâches associées à ce modèle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTemplate}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
