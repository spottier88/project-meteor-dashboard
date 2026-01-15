/**
 * Hook pour la gestion des notes de projet
 * Gère le CRUD des notes avec React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProjectNote, CreateProjectNoteInput, UpdateProjectNoteInput, ProjectNoteType } from "@/types/project-notes";

export const useProjectNotes = (projectId: string) => {
  const user = useUser();
  const queryClient = useQueryClient();

  // Récupérer toutes les notes du projet
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ["projectNotes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_notes")
        .select(`
          *,
          author:profiles!project_notes_author_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("project_id", projectId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectNote[];
    },
    enabled: !!projectId,
  });

  // Créer une nouvelle note
  const createNote = useMutation({
    mutationFn: async (input: CreateProjectNoteInput) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("project_notes")
        .insert({
          project_id: input.project_id,
          author_id: user.id,
          content: input.content,
          note_type: input.note_type,
        })
        .select(`
          *,
          author:profiles!project_notes_author_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data as ProjectNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectNotes", projectId] });
      toast.success("Note ajoutée avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la création de la note:", error);
      toast.error("Erreur lors de la création de la note");
    },
  });

  // Mettre à jour une note
  const updateNote = useMutation({
    mutationFn: async ({ noteId, input }: { noteId: string; input: UpdateProjectNoteInput }) => {
      const { data, error } = await supabase
        .from("project_notes")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .select(`
          *,
          author:profiles!project_notes_author_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data as ProjectNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectNotes", projectId] });
      toast.success("Note mise à jour");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour de la note:", error);
      toast.error("Erreur lors de la mise à jour de la note");
    },
  });

  // Supprimer une note
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("project_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectNotes", projectId] });
      toast.success("Note supprimée");
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression de la note:", error);
      toast.error("Erreur lors de la suppression de la note");
    },
  });

  // Épingler/désépingler une note
  const togglePinNote = useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) => {
      const { data, error } = await supabase
        .from("project_notes")
        .update({ is_pinned: !isPinned })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projectNotes", projectId] });
      toast.success(variables.isPinned ? "Note désépinglée" : "Note épinglée");
    },
    onError: (error) => {
      console.error("Erreur lors de l'épinglage de la note:", error);
      toast.error("Erreur lors de l'épinglage de la note");
    },
  });

  return {
    notes: notes || [],
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePinNote,
    userId: user?.id,
  };
};
