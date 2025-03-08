
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type PromptSection = "objectifs" | "contexte" | "cibles" | "resultats_attendus" | "risques" | "enjeux" | "general";

interface FrameworkNoteGeneratorProps {
  project: Project;
}

export const FrameworkNoteGenerator = ({ project }: FrameworkNoteGeneratorProps) => {
  const [activeTab, setActiveTab] = useState<PromptSection>("general");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez saisir une demande pour générer une note de cadrage"
      });
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Vous devez être connecté pour utiliser cette fonctionnalité");
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          projectId: project.id,
          promptType: "framework_note",
          promptSection: activeTab,
          maxTokens: 2000,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la génération de la note de cadrage");
      }

      const data = await res.json();
      setResponse(data.message.content);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la génération de la note de cadrage"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!response) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune note de cadrage à sauvegarder"
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Vous devez être connecté pour utiliser cette fonctionnalité");
      }

      // Structure de la note
      const noteContent = {
        content: response,
        generated_at: new Date().toISOString(),
        prompt: prompt,
        prompt_section: activeTab
      };

      // Sauvegarde en base de données
      const { error } = await supabase
        .from("project_framework_notes")
        .insert({
          project_id: project.id,
          content: noteContent,
          created_by: sessionData.session.user.id,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Note de cadrage sauvegardée",
        description: "La note de cadrage a été sauvegardée avec succès"
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde de la note de cadrage"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sectionLabels: Record<PromptSection, string> = {
    general: "Général",
    objectifs: "Objectifs",
    contexte: "Contexte",
    cibles: "Cibles",
    resultats_attendus: "Résultats attendus",
    risques: "Risques",
    enjeux: "Enjeux"
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Génération de note de cadrage</CardTitle>
        <CardDescription>
          Utilisez l'IA pour générer une note de cadrage pour ce projet.
          Sélectionnez la section sur laquelle vous souhaitez travailler.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PromptSection)}>
          <TabsList className="mb-4">
            {Object.entries(sectionLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Votre demande</h3>
              <Textarea 
                placeholder={`Décrivez ce que vous souhaitez pour la section "${sectionLabels[activeTab]}" de la note de cadrage...`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                "Générer la note de cadrage"
              )}
            </Button>

            {response && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Note de cadrage générée</h3>
                <div className="border rounded-md p-4 bg-muted/30 whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
      {response && (
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={isSaving || !response}
            className="ml-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder cette note
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
