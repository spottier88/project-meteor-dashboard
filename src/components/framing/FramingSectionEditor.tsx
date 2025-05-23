
/**
 * @component FramingSectionEditor
 * @description Éditeur pour les sections du cadrage de projet.
 * Permet de modifier les différentes sections du document de cadrage
 * (contexte, parties prenantes, gouvernance, objectifs, calendrier, livrables).
 * Gère la sauvegarde des modifications dans la base de données.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, X } from "lucide-react";

interface FramingSectionEditorProps {
  projectId: string;
  sectionTitle: string;
  sectionKey: string;
  content: string | null;
  onCancel: () => void;
}

export const FramingSectionEditor = ({
  projectId,
  sectionTitle,
  sectionKey,
  content,
  onCancel,
}: FramingSectionEditorProps) => {
  const [value, setValue] = useState(content || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      // 1. Récupérer d'abord les données existantes
      const { data: existingData, error: fetchError } = await supabase
        .from("project_framing")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // 2. Préparer les données à mettre à jour
      const updatedData = {
        project_id: projectId,
        ...(existingData || {}), // Utiliser les données existantes comme base
        [sectionKey]: value, // Remplacer seulement la section éditée
      };
      
      // 3. Faire l'upsert avec toutes les données
      const { data, error } = await supabase
        .from("project_framing")
        .upsert(updatedData, {
          onConflict: "project_id",
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Section mise à jour",
        description: `La section "${sectionTitle}" a été mise à jour avec succès.`,
      });
      queryClient.invalidateQueries(["project-framing", projectId]);
      onCancel();
    },
    onError: (error) => {
      console.error("Error updating framing section:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la section.",
      });
    },
  });

  return (
    <div className="space-y-4">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Saisissez le contenu pour la section ${sectionTitle}`}
        className="min-h-[150px]"
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-1" />
          Annuler
        </Button>
        <Button
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};
