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
  project_id?: string;
  activity_type?: string;
  points: number;
  week_start_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
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
