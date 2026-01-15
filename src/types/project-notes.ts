/**
 * Types pour les notes de projet (bloc-notes / journal de bord)
 */

// Types de notes disponibles
export type ProjectNoteType = 'meeting' | 'memo' | 'decision' | 'other';

// Labels pour les types de notes
export const noteTypeLabels: Record<ProjectNoteType, string> = {
  meeting: 'Réunion',
  memo: 'Mémo',
  decision: 'Décision',
  other: 'Autre',
};

// Couleurs pour les badges de type
export const noteTypeColors: Record<ProjectNoteType, string> = {
  meeting: 'bg-blue-100 text-blue-800',
  memo: 'bg-gray-100 text-gray-800',
  decision: 'bg-green-100 text-green-800',
  other: 'bg-purple-100 text-purple-800',
};

// Interface principale d'une note de projet
export interface ProjectNote {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  note_type: ProjectNoteType;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Données jointes (auteur)
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

// Interface pour la création d'une note
export interface CreateProjectNoteInput {
  project_id: string;
  content: string;
  note_type: ProjectNoteType;
}

// Interface pour la mise à jour d'une note
export interface UpdateProjectNoteInput {
  content?: string;
  note_type?: ProjectNoteType;
  is_pinned?: boolean;
}
