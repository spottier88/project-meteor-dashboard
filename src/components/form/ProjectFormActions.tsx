
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/auth-helpers-react";
import { MonitoringLevel } from "@/types/monitoring";

interface ProjectFormActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  project?: {
    id: string;
    owner_id?: string;
    pole_id?: string;
    direction_id?: string;
  };
  formData: {
    title: string;
    description: string;
    projectManager: string;
    startDate?: Date;
    endDate?: Date;
    priority: string;
    monitoringLevel: MonitoringLevel;
    monitoringEntityId: string | null;
    ownerId: string;
    poleId: string;
    directionId: string;
    serviceId: string;
  };
  user: User | null;
  isAdmin: boolean;
  isManager: boolean;
}

export const ProjectFormActions = ({
  isSubmitting,
  onClose,
  onSubmit,
  project,
  formData,
  user,
  isAdmin,
  isManager,
}: ProjectFormActionsProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    // Validation des champs obligatoires
    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre du projet est requis",
        variant: "destructive",
      });
      return;
    }

    if (!formData.projectManager.trim()) {
      toast({
        title: "Erreur",
        description: "Le chef de projet est requis",
        variant: "destructive",
      });
      return;
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être postérieure à la date de début",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer ou modifier un projet",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const projectData = {
        title: formData.title,
        description: formData.description,
        project_manager: formData.projectManager,
        start_date: formData.startDate?.toISOString().split('T')[0],
        end_date: formData.endDate?.toISOString().split('T')[0],
        priority: formData.priority,
        owner_id: formData.ownerId || null,
        pole_id: formData.poleId === "none" ? null : formData.poleId,
        direction_id: formData.directionId === "none" ? null : formData.directionId,
        service_id: formData.serviceId === "none" ? null : formData.serviceId,
      };

      if (project?.id) {
        // Vérification des permissions pour la modification
        const { data: canEdit } = await supabase.rpc('can_manage_project', {
          p_user_id: user.id,
          p_project_id: project.id
        });

        if (!canEdit && !isAdmin) {
          toast({
            title: "Erreur",
            description: "Vous n'avez pas les droits nécessaires pour modifier ce projet",
            variant: "destructive",
          });
          return;
        }

        const { error: projectError } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", project.id);

        if (projectError) {
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour le projet. Vérifiez vos permissions.",
            variant: "destructive",
          });
          return;
        }

        const { error: monitoringError } = await supabase
          .from("project_monitoring")
          .upsert({
            project_id: project.id,
            monitoring_level: formData.monitoringLevel,
            monitoring_entity_id: formData.monitoringEntityId,
          }, {
            onConflict: 'project_id'
          });

        if (monitoringError) {
          toast({
            title: "Avertissement",
            description: "Le projet a été mis à jour mais le monitoring n'a pas pu être configuré",
            variant: "destructive",
          });
        }

        toast({
          title: "Succès",
          description: "Le projet a été mis à jour",
        });
      } else {
        // Création d'un nouveau projet
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert(projectData)
          .select()
          .single();

        if (projectError) {
          toast({
            title: "Erreur",
            description: "Impossible de créer le projet: " + projectError.message,
            variant: "destructive",
          });
          return;
        }

        const { error: monitoringError } = await supabase
          .from("project_monitoring")
          .insert({
            project_id: newProject.id,
            monitoring_level: formData.monitoringLevel,
            monitoring_entity_id: formData.monitoringEntityId,
          });

        if (monitoringError) {
          toast({
            title: "Avertissement",
            description: "Le projet a été créé mais le monitoring n'a pas pu être configuré",
          });
        }

        toast({
          title: "Succès",
          description: "Le projet a été créé",
        });
      }

      onSubmit();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={onClose}>
        Annuler
      </Button>
      <Button onClick={handleSubmit} disabled={isSubmitting || isProcessing}>
        {isSubmitting || isProcessing ? (
          "Enregistrement..."
        ) : project ? (
          "Mettre à jour"
        ) : (
          "Créer"
        )}
      </Button>
    </>
  );
};
