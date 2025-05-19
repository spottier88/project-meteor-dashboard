
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProjectTemplateList } from '@/components/templates/ProjectTemplateList';
import { ProjectTemplateDialog } from '@/components/templates/ProjectTemplateDialog';
import { useToast } from "@/components/ui/use-toast";
import { useProjectTemplates } from '@/hooks/useProjectTemplates';

export const ProjectTemplateManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{id: string, title: string, description: string} | null>(null);
  
  const { 
    templates,
    isLoadingTemplates,
    createTemplate,
    updateTemplate, 
    deleteTemplate,
    isLoadingAction
  } = useProjectTemplates();

  const handleCreateTemplate = async (title: string, description: string) => {
    try {
      await createTemplate({ title, description });
      toast({
        title: "Modèle créé",
        description: "Le modèle de projet a été créé avec succès.",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du modèle.",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = async (id: string, title: string, description: string) => {
    try {
      await updateTemplate({ id, title, description });
      toast({
        title: "Modèle modifié",
        description: "Le modèle de projet a été modifié avec succès.",
      });
      setEditingTemplate(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification du modèle.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      toast({
        title: "Modèle supprimé",
        description: "Le modèle de projet a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du modèle.",
        variant: "destructive",
      });
    }
  };

  const openTemplateDetails = (templateId: string) => {
    navigate(`/admin/templates/${templateId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des modèles de projet</h1>
        <p className="text-muted-foreground">
          Créez et gérez des modèles pour accélérer la création de vos projets.
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div></div>
        <Button onClick={() => {
          setEditingTemplate(null);
          setIsDialogOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      <ProjectTemplateList
        templates={templates}
        isLoading={isLoadingTemplates || isLoadingAction}
        onEdit={(template) => {
          setEditingTemplate({
            id: template.id,
            title: template.title,
            description: template.description || ""
          });
          setIsDialogOpen(true);
        }}
        onDelete={handleDeleteTemplate}
        onViewDetails={openTemplateDetails}
      />

      <ProjectTemplateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingTemplate ? 
          (title, description) => handleEditTemplate(editingTemplate.id, title, description) :
          handleCreateTemplate
        }
        defaultValues={editingTemplate || undefined}
        title={editingTemplate ? "Modifier le modèle" : "Créer un modèle"}
      />
    </div>
  );
};
