
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Trash2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FrameworkNotesListProps {
  projectId: string;
  onViewNote: (note: any) => void;
  onEditNote?: (note: any) => void;
  canEdit: boolean;
}

export const FrameworkNotesList = ({ 
  projectId, 
  onViewNote, 
  onEditNote,
  canEdit
}: FrameworkNotesListProps) => {
  const { toast } = useToast();
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ["frameworkNotes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_framework_notes")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("project_framework_notes")
        .delete()
        .eq("id", noteId);
      
      if (error) throw error;
      return noteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frameworkNotes", projectId] });
      toast({
        title: "Note supprimée",
        description: "La note de cadrage a été supprimée avec succès"
      });
      setNoteToDelete(null);
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression de la note:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la note de cadrage"
      });
      setNoteToDelete(null);
    }
  });

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    deleteMutation.mutate(noteToDelete);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) return <div className="py-4 text-center text-muted-foreground">Chargement des notes de cadrage...</div>;
  if (error) return <div className="py-4 text-center text-destructive">Erreur lors du chargement des notes de cadrage</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Notes de cadrage</CardTitle>
        <CardDescription>
          Notes de cadrage générées pour ce projet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notes && notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note, index) => (
              <div key={note.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      <FileText className="inline-block mr-1 h-4 w-4" />
                      Note v{note.version} - {formatDate(note.created_at)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {typeof note.content === 'object' && note.content && 'prompt_section' in note.content 
                        ? `Section: ${note.content.prompt_section}` 
                        : "Section générale"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onViewNote(note)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {canEdit && onEditNote && (
                      <Button variant="ghost" size="icon" onClick={() => onEditNote(note)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canEdit && (
                      <AlertDialog open={noteToDelete === note.id} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setNoteToDelete(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. La note de cadrage sera définitivement supprimée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteNote}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            Aucune note de cadrage générée pour ce projet
          </div>
        )}
      </CardContent>
    </Card>
  );
};
