
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FrameworkNoteEditProps {
  note: any;
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const FrameworkNoteEdit = ({ note, isOpen, onClose, projectId }: FrameworkNoteEditProps) => {
  const [content, setContent] = useState(note?.content?.content || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateMutation = useMutation({
    mutationFn: async () => {
      // Créer une copie du contenu de la note et mettre à jour le contenu
      const updatedContent = {
        ...note.content,
        content: content,
        edited_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("project_framework_notes")
        .update({ content: updatedContent })
        .eq("id", note.id);

      if (error) throw error;
      return note.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNotes", projectId] });
      toast({
        title: "Note mise à jour",
        description: "La note de cadrage a été mise à jour avec succès"
      });
      onClose();
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour de la note:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la note de cadrage"
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Éditer la note de cadrage v{note.version} - {formatDate(note.created_at)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="my-4">
          <Textarea 
            className="min-h-[300px] font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
