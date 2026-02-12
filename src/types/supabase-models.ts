/**
 * Types dérivés des modèles Supabase pour remplacer les `any` dans l'application.
 * Ces interfaces représentent les objets tels qu'ils sont manipulés dans le code front-end.
 */

import { ProjectLifecycleStatus, ProjectStatus, ProgressStatus, ForEntityType } from "./project";

/**
 * Données d'un projet tel que retourné par Supabase (table projects)
 */
export interface ProjectRecord {
  id: string;
  title: string;
  description?: string | null;
  status?: ProjectStatus | null;
  progress?: ProgressStatus | null;
  completion?: number | null;
  project_manager?: string | null;
  owner_id?: string | null;
  pole_id?: string | null;
  direction_id?: string | null;
  service_id?: string | null;
  lifecycle_status?: ProjectLifecycleStatus;
  for_entity_type?: ForEntityType | string;
  for_entity_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: string | null;
  teams_url?: string | null;
  closure_status?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  template_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Données d'une revue de projet (table reviews)
 */
export interface ReviewRecord {
  id: string;
  project_id: string;
  weather?: ProjectStatus | null;
  progress?: ProgressStatus | null;
  completion?: number | null;
  difficulties?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  next_steps?: string | null;
  actions?: string | null;
}

/**
 * Données d'un risque (table risks)
 */
export interface RiskRecord {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  probability?: string | null;
  impact?: string | null;
  status?: string | null;
  mitigation?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Données d'une tâche (table tasks)
 */
export interface TaskRecord {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in_progress" | "done";
  due_date?: string | null;
  start_date?: string | null;
  assignee?: string | null;
  parent_task_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Callback de soumission de projet utilisé dans les formulaires
 */
export type ProjectSubmitCallback = (projectData: ProjectRecord) => Promise<ProjectRecord | void>;
