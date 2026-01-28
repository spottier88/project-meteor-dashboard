/**
 * Hook pour la gestion des notes de projet
 * Gère le CRUD des notes avec React Query
 * Inclut l'envoi de notifications email aux membres du projet
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProjectNote, CreateProjectNoteInput, UpdateProjectNoteInput, ProjectNoteType } from "@/types/project-notes";
import { noteTypeLabels } from "@/types/project-notes";

/**
 * Récupère tous les membres à notifier pour un projet
 * (chef de projet principal, chefs secondaires, membres)
 * Exclut l'auteur de la note pour ne pas le notifier de sa propre action
 */
const getProjectMembersToNotify = async (
  projectId: string, 
  excludeUserId: string
): Promise<Array<{ userId: string; role: string }>> => {
  const members: Array<{ userId: string; role: string }> = [];

  // 1. Récupérer le chef de projet principal
  const { data: project } = await supabase
    .from("projects")
    .select("project_manager_id")
    .eq("id", projectId)
    .single();

  if (project?.project_manager_id && project.project_manager_id !== excludeUserId) {
    members.push({
      userId: project.project_manager_id,
      role: 'project_manager'
    });
  }

  // 2. Récupérer les membres du projet (secondaires et membres)
  const { data: projectMembers } = await supabase
    .from("project_members")
    .select("user_id, role")
    .eq("project_id", projectId)
    .neq("user_id", excludeUserId);

  projectMembers?.forEach(member => {
    members.push({
      userId: member.user_id,
      role: member.role
    });
  });

  return members;
};

/**
 * Ajoute les notifications email pour une nouvelle note de projet
 * Insertion dans email_notification_queue pour traitement par send-email-digest
 * Non bloquant : les erreurs sont loguées mais n'empêchent pas la création de la note
 */
const sendNoteNotifications = async (
  note: ProjectNote,
  projectId: string,
  authorId: string
) => {
  try {
    // Récupérer les informations du projet (titre)
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    // Récupérer les membres à notifier (exclure l'auteur)
    const membersToNotify = await getProjectMembersToNotify(projectId, authorId);

    if (membersToNotify.length === 0) {
      console.log("[useProjectNotes] Aucun membre à notifier pour cette note");
      return;
    }

    // Créer les entrées de notification pour chaque membre
    const notifications = membersToNotify.map(member => ({
      user_id: member.userId,
      event_type: 'project_note_added' as const,
      event_data: {
        project_id: projectId,
        project_title: project?.title || 'Projet sans titre',
        note_id: note.id,
        note_type: note.note_type,
        note_type_label: noteTypeLabels[note.note_type as ProjectNoteType] || note.note_type,
        note_content_preview: note.content.substring(0, 150) + 
          (note.content.length > 150 ? '...' : ''),
        author_name: [note.author?.first_name, note.author?.last_name]
          .filter(Boolean).join(' ') || 'Utilisateur',
        author_email: note.author?.email || '',
        created_at: note.created_at,
      }
    }));

    // Insérer dans la file de notifications email
    const { error } = await supabase
      .from("email_notification_queue")
      .insert(notifications);

    if (error) {
      console.error("[useProjectNotes] Erreur lors de l'ajout des notifications de note:", error);
    } else {
      console.log(`[useProjectNotes] ${notifications.length} notification(s) ajoutée(s) pour la note`);
    }
  } catch (error) {
    console.error("[useProjectNotes] Erreur lors de l'envoi des notifications de note:", error);
    // Non bloquant - la note est déjà créée
  }
};

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
      
      // Envoyer les notifications aux membres du projet (non bloquant)
      sendNoteNotifications(data as ProjectNote, input.project_id, user.id);
      
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
