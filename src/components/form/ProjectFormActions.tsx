import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/auth-helpers-react";

interface ProjectFormActionsProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  project?: {
    id: string;
    owner_id?: string;
  };
  formData: {
    title: string;
    description: string;
    projectManager: string;
    startDate?: Date;
    endDate?: Date;
    priority: string;
    suiviDgs: boolean;
    ownerId: string;
    poleId: string;
    directionId: string;
    serviceId: string;
  };
  user: User | null;
  isAdmin: boolean;
}

export const ProjectFormActions = ({
  isSubmitting,
  onClose,
  onSubmit,
  project,
  formData,
  user,
  isAdmin,
}: ProjectFormActionsProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
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
        suivi_dgs: formData.suiviDgs,
        owner_id: formData.ownerId || null,
        pole_id: formData.poleId === "none" ? null : formData.poleId,
        direction_id: formData.directionId === "none" ? null : formData.directionId,
        service_id: formData.serviceId === "none" ? null : formData.serviceId,
      };

      if (project?.id) {
        const canUpdate = isAdmin || project.owner_id === user.id;

        if (!canUpdate) {
          toast({
            title: "Erreur",
            description: "Vous n'avez pas les droits pour modifier ce projet",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", project.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Le projet a été mis à jour",
        });
      } else {
        const { error } = await supabase.from("projects").insert(projectData);

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Erreur",
              description: "Un projet avec ce titre existe déjà",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Succès",
          description: "Le projet a été créé",
        });
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
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