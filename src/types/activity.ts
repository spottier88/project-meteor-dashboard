
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
  project_id: string;
  activity_type: string;
  description?: string;
  start_time: string;
  duration_minutes: number;
  created_at: string;
}

export interface ActivityWithDetails extends Activity {
  project_title: string;
  activity_type_label: string;
  activity_type_color: string;
}

// Interface pour la saisie en masse d'activités
export interface BulkActivityEntry {
  id: string; // ID temporaire pour gérer les lignes dans l'UI
  project_id: string;
  activity_type: string;
  description: string;
  duration_minutes: number;
  start_time: string;
  isValid?: boolean;
}
