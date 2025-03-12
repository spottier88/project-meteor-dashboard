
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { FrameworkNoteCollection, FrameworkNoteSection, FrameworkNoteStatus, ProjectFrameworkNote } from '@/types/framework-notes';
import { useUser } from '@supabase/auth-helpers-react';

export const useFrameworkNotes = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useUser();

  // Fetch all notes for a specific project
  const { data: projectNotes, isLoading: isLoadingProjectNotes } = useQuery({
    queryKey: ['projectFrameworkNotes', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_framework_notes')
        .select('*')
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
      
      return data as ProjectFrameworkNote[];
    },
    enabled: !!projectId,
  });

  // Create a new note for a project
  const createProjectNote = useMutation({
    mutationFn: async (data: {
      projectId: string;
      content: Record<string, any>;
      status?: FrameworkNoteStatus;
    }) => {
      const { data: newNote, error } = await supabase
        .from('project_framework_notes')
        .insert({
          project_id: data.projectId,
          content: data.content,
          status: data.status || 'draft',
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de créer la note de cadrage',
        });
        throw error;
      }
      
      return newNote as ProjectFrameworkNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFrameworkNotes', projectId] });
      toast({
        title: 'Succès',
        description: 'Note de cadrage créée avec succès',
      });
    },
  });

  // Update an existing note
  const updateProjectNote = useMutation({
    mutationFn: async (data: {
      noteId: string;
      content?: Record<string, any>;
      status?: FrameworkNoteStatus;
    }) => {
      const updateData: Partial<ProjectFrameworkNote> = {};
      
      if (data.content) updateData.content = data.content;
      if (data.status) updateData.status = data.status;
      
      const { data: updatedNote, error } = await supabase
        .from('project_framework_notes')
        .update(updateData)
        .eq('id', data.noteId)
        .select()
        .single();
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de mettre à jour la note de cadrage',
        });
        throw error;
      }
      
      return updatedNote as ProjectFrameworkNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFrameworkNotes', projectId] });
      toast({
        title: 'Succès',
        description: 'Note de cadrage mise à jour avec succès',
      });
    },
  });

  // Delete a note
  const deleteProjectNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('project_framework_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de supprimer la note de cadrage',
        });
        throw error;
      }
      
      return noteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFrameworkNotes', projectId] });
      toast({
        title: 'Succès',
        description: 'Note de cadrage supprimée avec succès',
      });
    },
  });

  // Get a specific note by id
  const { data: singleNote, isLoading: isLoadingSingleNote } = useQuery({
    queryKey: ['frameworkNote', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('project_framework_notes')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Impossible de charger la note de cadrage',
          });
        }
        return null;
      }
      
      return data as ProjectFrameworkNote;
    },
    enabled: !!projectId && projectId.length > 0,
  });

  return {
    projectNotes,
    isLoadingProjectNotes,
    createProjectNote,
    updateProjectNote,
    deleteProjectNote,
    singleNote,
    isLoadingSingleNote,
  };
};
