
export interface ActivityType {
  id: string;
  code: string;
  label: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

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
  projectCode?: string; // Code projet extrait de la description
  activityTypeCode?: string; // Code type d'activité extrait de la description
}

export interface Activity {
  id: string;
  user_id: string;
  project_id?: string; // Maintenant optionnel
  activity_type: string;
  description?: string;
  start_time: string;
  duration_minutes: number;
  created_at: string;
}

export interface ActivityWithDetails extends Activity {
  project_title?: string; // Maintenant optionnel
  activity_type_label: string;
  activity_type_color: string;
}

// Interface pour la saisie en masse d'activités
export interface BulkActivityEntry {
  id: string; // ID temporaire pour gérer les lignes dans l'UI
  project_id?: string; // Maintenant optionnel
  activity_type: string;
  description: string;
  duration_minutes: number;
  start_time: string;
  isValid?: boolean;
}

// Nouvelles interfaces pour les permissions des types d'activités
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

// Interface pour le nouveau système de points hebdomadaires
export interface ActivityPoint {
  id: string;
  user_id: string;
  project_id?: string;
  activity_type?: string;
  points: number;
  week_start_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Interface enrichie avec les détails du projet et type d'activité
export interface ActivityPointWithDetails extends ActivityPoint {
  project_title?: string;
  activity_type_label?: string;
  activity_type_color?: string;
}
