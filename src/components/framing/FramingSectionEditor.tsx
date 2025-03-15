
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
      const { data, error } = await supabase
        .from("project_framing")
        .upsert({
          project_id: projectId,
          [sectionKey]: value,
        }, {
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
