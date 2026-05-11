/**
 * Types pour le système de suivi d'activités par points
 */

export interface ActivityType {
  id: string;
  code: string;
  label: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

// Interfaces conservées pour l'import calendrier Microsoft
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  selected: boolean;
  projectId?: string;
  activityType?: string;
  projectCode?: string;
  activityTypeCode?: string;
}

// Interface pour le système de points hebdomadaires
export interface ActivityPoint {
  id: string;
  user_id: string;
  project_id?: string | null;
  activity_type?: string | null;
  points: number;
  week_start_date: string;
  /** Date du jour pour la saisie quotidienne (mode 'daily'). Null en mode hebdomadaire. */
  activity_date?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
  /** Projet joint via la relation Supabase (lecture seule, optionnel) */
  projects?: { id: string; title: string } | null;
  /** Type d'activité enrichi via le join Supabase (lecture seule, optionnel) */
  activity_types?: { code: string; label: string; color: string } | null;
}

export interface ActivityPointWithDetails extends ActivityPoint {
  project_title?: string;
  activity_type_label?: string;
  activity_type_color?: string;
}

// Permissions des types d'activités
export interface ActivityTypePermission {
  id: string;
  activity_type_code: string;
  entity_type: 'pole' | 'direction' | 'service';
  entity_id: string;
  created_at: string;
}

export interface HierarchyEntity {
  id: string;
  name: string;
  selected?: boolean;
}
