
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export const useProjectFormHandlers = (selectedProject?: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const handleProjectFormSubmit = async (projectData: any) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Si c'est une modification
      if (selectedProject?.id) {
        const { error } = await supabase
          .from("projects")
          .update({
            title: projectData.title,
            description: projectData.description,
            project_manager: projectData.project_manager,
            project_manager_id: projectData.project_manager_id,
            pole_id: projectData.pole_id,
            direction_id: projectData.direction_id,
            service_id: projectData.service_id,
            start_date: projectData.start_date,
            end_date: projectData.end_date,
            for_entity_type: projectData.for_entity_type,
            for_entity_id: projectData.for_entity_id,
            priority: projectData.priority,
            lifecycle_status: projectData.lifecycle_status,
          })
          .eq("id", selectedProject.id);

        if (error) throw error;

        toast({
          title: "Projet modifié",
          description: "Le projet a été modifié avec succès",
        });
      } else {
        // Si c'est une création
        const { error } = await supabase
          .from("projects")
          .insert({
            ...projectData,
            owner_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Projet créé",
          description: "Le projet a été créé avec succès",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du projet:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleProjectFormSubmit,
    isSubmitting,
  };
};
