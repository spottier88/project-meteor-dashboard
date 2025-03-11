
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, Trash } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from 'date-fns';

interface FrameworkNotesListProps {
  projectId: string;
  onViewNote: (note: any) => void;
  onEditNote: (note: any) => void;
  canEdit: boolean;
}

export const FrameworkNotesList: React.FC<FrameworkNotesListProps> = ({ 
  projectId, 
  onViewNote,
  onEditNote,
  canEdit 
}) => {
  const { toast } = useToast();
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ['frameworkNotes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_framework_notes')
        .select(`
          id,
          content,
          status,
          version,
          created_at,
          created_by,
          profiles:created_by (
            first_name,
            last_name,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les notes de cadrage',
        });
        throw error;
      }

      return data || [];
    },
  });

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('project_framework_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Note supprimée',
        description: 'La note de cadrage a été supprimée avec succès',
      });
      
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la note de cadrage',
      });
    } finally {
      setDeletingNoteId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Chargement des notes...</div>;
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">Aucune note de cadrage pour ce projet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Note v{note.version}</span>
              <span className="px-2 py-1 rounded text-xs bg-slate-200">
                {note.status === 'draft' ? 'Brouillon' : 
                 note.status === 'published' ? 'Publiée' : 'Archivée'}
              </span>
            </CardTitle>
            <CardDescription>
              Créée le {formatDate(new Date(note.created_at), 'dd/MM/yyyy')}
              {note.profiles && (
                <div className="text-xs mt-1">
                  Par {note.profiles.first_name || ''} {note.profiles.last_name || ''}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="truncate text-sm">
              {Object.keys(note.content).length} sections complétées
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" onClick={() => onViewNote(note)}>
              <Eye className="h-4 w-4 mr-1" /> Voir
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={() => onEditNote(note)}>
                  <Pencil className="h-4 w-4 mr-1" /> Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash className="h-4 w-4 mr-1" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action ne peut pas être annulée. Cette note de cadrage sera définitivement supprimée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteNote(note.id)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
