
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, X } from "lucide-react";
import { AIGenerateButton } from "./AIGenerateButton";
import { useFramingAIGeneration } from "@/hooks/useFramingAIGeneration";
import { FramingSectionKey } from "@/utils/framingAIHelpers";

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
  const { generateSection, isGenerating, generatingSection } = useFramingAIGeneration();

  // Récupérer les informations du projet pour le contexte IA
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("title, description, start_date, end_date")
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Gestionnaire pour la génération IA
  const handleGenerateAI = async () => {
    if (!project) return;

    const projectContext = {
      title: project.title,
      description: project.description || "",
      startDate: project.start_date,
      endDate: project.end_date,
    };

    const generated = await generateSection(
      sectionKey as FramingSectionKey,
      value, // Contenu actuel comme contexte
      projectContext,
      projectId
    );

    if (generated) {
      setValue(generated);
    }
  };

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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Contenu</label>
          <AIGenerateButton
            onClick={handleGenerateAI}
            isGenerating={isGenerating && generatingSection === sectionKey}
            disabled={isGenerating || !project}
            size="sm"
            tooltipText={`Générer "${sectionTitle}" avec l'IA`}
          />
        </div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Saisissez le contenu pour la section ${sectionTitle}`}
          className="min-h-[150px]"
          disabled={isGenerating}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading || isGenerating}
        >
          <X className="h-4 w-4 mr-1" />
          Annuler
        </Button>
        <Button
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading || isGenerating}
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
