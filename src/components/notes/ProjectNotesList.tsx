/**
 * @component ProjectNotesList
 * @description Affiche la liste des notes d'un projet avec le formulaire d'ajout.
 * Gère l'affichage, la création, l'édition et la suppression des notes.
 */

import { useState, useRef } from "react";
import { useProjectNotes } from "@/hooks/useProjectNotes";
import { ProjectNoteForm } from "./ProjectNoteForm";
import { ProjectNoteCard } from "./ProjectNoteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import type { ProjectNote, ProjectNoteType } from "@/types/project-notes";

interface ProjectNotesListProps {
  projectId: string;
  canEdit: boolean;
  isAdmin: boolean;
}

export const ProjectNotesList = ({
  projectId,
  canEdit,
  isAdmin,
}: ProjectNotesListProps) => {
  const {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    togglePinNote,
    userId,
  } = useProjectNotes(projectId);

  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fonction pour restaurer le focus sur le conteneur
  const focusContainer = () => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  // Créer une nouvelle note
  const handleCreate = (input: { project_id: string; content: string; note_type: ProjectNoteType }) => {
    createNote.mutate(input);
  };

  // Mettre à jour une note
  const handleUpdate = (noteId: string, content: string, noteType: ProjectNoteType) => {
    updateNote.mutate({ 
      noteId, 
      input: { content, note_type: noteType } 
    });
    setEditingNote(null);
  };

  // Supprimer une note avec restauration du focus
  const handleDelete = (noteId: string) => {
    deleteNote.mutate(noteId, {
      onSuccess: () => {
        // Restaurer le focus sur le conteneur après suppression
        setTimeout(() => focusContainer(), 0);
      },
    });
  };

  // Épingler/désépingler une note
  const handleTogglePin = (noteId: string, isPinned: boolean) => {
    togglePinNote.mutate({ noteId, isPinned });
  };

  // Déterminer les permissions pour chaque note
  const canEditNote = (note: ProjectNote) => {
    return isAdmin || note.author_id === userId;
  };

  const canDeleteNote = (note: ProjectNote) => {
    return isAdmin || note.author_id === userId;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} tabIndex={-1} className="space-y-4 outline-none">
      {/* Formulaire d'ajout (visible pour ceux qui peuvent éditer) */}
      {canEdit && !editingNote && (
        <ProjectNoteForm
          projectId={projectId}
          onSubmit={handleCreate}
          isLoading={createNote.isPending}
        />
      )}

      {/* Formulaire d'édition */}
      {editingNote && (
        <ProjectNoteForm
          projectId={projectId}
          onSubmit={handleCreate}
          onCancel={() => setEditingNote(null)}
          isLoading={updateNote.isPending}
          editingNote={editingNote}
          onUpdate={handleUpdate}
        />
      )}

      {/* Liste des notes */}
      {notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucune note pour le moment</p>
          <p className="text-sm">
            {canEdit 
              ? "Ajoutez une première note pour documenter le projet."
              : "Les notes du projet apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <ProjectNoteCard
              key={note.id}
              note={note}
              canEdit={canEditNote(note)}
              canDelete={canDeleteNote(note)}
              onEdit={setEditingNote}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
};
