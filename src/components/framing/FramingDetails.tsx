
/**
 * @component FramingDetails
 * @description Affichage du document de cadrage d'un projet.
 * Présente les différentes sections du cadrage (contexte, parties prenantes,
 * gouvernance, objectifs, calendrier, livrables) et permet leur édition
 * si l'utilisateur en a les droits.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { FramingSectionEditor } from "./FramingSectionEditor";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { useFramingAIGeneration } from "@/hooks/useFramingAIGeneration";
import { AIGenerateButton } from "./AIGenerateButton";
import { FramingSectionKey } from "@/utils/framingAIHelpers";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FramingDetailsProps {
  projectId: string;
}

type SectionKey = "context" | "stakeholders" | "governance" | "objectives" | "timeline" | "deliverables";

interface Section {
  title: string;
  key: SectionKey;
}

export const FramingDetails = ({ projectId }: FramingDetailsProps) => {
  const { canEdit } = useProjectPermissions(projectId);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { generateAllSections, isGenerating, generatingSection } = useFramingAIGeneration();

  const { data: framing, isLoading } = useQuery({
    queryKey: ["project-framing", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_framing")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project framing:", error);
        throw error;
      }

      return data;
    },
    enabled: !!projectId,
  });

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
    enabled: !!projectId,
  });

  // Mutation pour sauvegarder toutes les sections générées
  const { mutate: saveAllSections, isPending: isSaving } = useMutation({
    mutationFn: async (generatedSections: Record<FramingSectionKey, string>) => {
      const { data: existingData, error: fetchError } = await supabase
        .from("project_framing")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      const updatedData = {
        project_id: projectId,
        ...(existingData || {}),
        ...generatedSections,
      };
      
      const { error } = await supabase
        .from("project_framing")
        .upsert(updatedData, {
          onConflict: "project_id",
        });
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Note de cadrage générée",
        description: "Toutes les sections ont été générées et sauvegardées avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["project-framing", projectId] });
    },
    onError: (error) => {
      console.error("Error saving all sections:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde des sections.",
      });
    },
  });

  // Gestionnaire pour générer toute la note
  const handleGenerateAll = async () => {
    if (!project) return;

    const projectContext = {
      title: project.title,
      description: project.description || "",
      startDate: project.start_date,
      endDate: project.end_date,
    };

    const sectionsData: Record<FramingSectionKey, string> = {
      context: framing?.context || "",
      stakeholders: framing?.stakeholders || "",
      governance: framing?.governance || "",
      objectives: framing?.objectives || "",
      timeline: framing?.timeline || "",
      deliverables: framing?.deliverables || "",
    };

    const generated = await generateAllSections(
      sectionsData,
      projectContext,
      projectId
    );

    if (generated) {
      saveAllSections(generated);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sections: Section[] = [
    { title: "Contexte", key: "context" },
    { title: "Parties prenantes", key: "stakeholders" },
    { title: "Gouvernance", key: "governance" },
    { title: "Objectifs", key: "objectives" },
    { title: "Calendrier", key: "timeline" },
    { title: "Livrables", key: "deliverables" },
  ];

  if (!framing && !canEdit) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Aucun élément de cadrage n'a été défini pour ce projet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className={`h-6 w-6 shrink-0 ${
                  generatingSection === 'all' ? 'text-primary animate-pulse' : 'text-primary'
                }`} />
                <div className="space-y-1">
                  <h3 className="font-semibold">Génération IA complète</h3>
                  <p className="text-sm text-muted-foreground">
                    Générer toutes les sections de la note de cadrage en une seule fois
                  </p>
                </div>
              </div>
              <AIGenerateButton
                onClick={handleGenerateAll}
                isGenerating={generatingSection === 'all'}
                label="Générer toute la note"
                disabled={isGenerating || isSaving || !project}
                variant="default"
                className="w-full sm:w-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isGenerating && generatingSection === 'all' && (
        <Alert>
          <Sparkles className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Génération en cours... L'IA analyse le contexte du projet et génère les sections. Cela peut prendre quelques instants.
          </AlertDescription>
        </Alert>
      )}

      {sections.map((section) => (
        <Card key={section.key} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">{section.title}</CardTitle>
            {canEdit && editingSection !== section.key && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingSection(section.key)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingSection === section.key ? (
              <FramingSectionEditor
                projectId={projectId}
                sectionTitle={section.title}
                sectionKey={section.key}
                content={framing?.[section.key] || ""}
                onCancel={() => setEditingSection(null)}
              />
            ) : framing?.[section.key] ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{framing[section.key]}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                {canEdit 
                  ? "Cliquez sur le bouton d'édition pour définir cette section"
                  : "Aucune information définie"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
