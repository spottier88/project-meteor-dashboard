
export type ProjectStatus = "sunny" | "cloudy" | "stormy";
export type ProgressStatus = "better" | "stable" | "worse";
export type ProjectLifecycleStatus = "study" | "validated" | "in_progress" | "completed" | "suspended" | "abandoned";

export const lifecycleStatusLabels: Record<ProjectLifecycleStatus, string> = {
  study: "À l'étude",
  validated: "Validé",
  in_progress: "En cours",
  completed: "Terminé",
  suspended: "Suspendu",
  abandoned: "Abandonné",
};

export type ForEntityType = "pole" | "direction" | "service" | null;

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus | null;
  progress: ProgressStatus | null;
  completion: number;
  lastReviewDate: string | null;
  project_manager?: string;
  owner_id?: string;
  pole_id?: string;
  direction_id?: string;
  service_id?: string;
  lifecycle_status: ProjectLifecycleStatus;
  for_entity_type?: ForEntityType;
  for_entity_id?: string;
  weather?: ProjectStatus | null; // Add the weather property
}

// Interface qui étend Project avec les propriétés additionnelles de ProjectListItem
export interface ProjectWithExtendedData extends Project {
  project_manager_name?: string | null;
  pole_name?: string | null;
  direction_name?: string | null;
  service_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  monitoring_level?: string | null;
  monitoring_entity_id?: string | null;
  suivi_dgs?: boolean | null;
  priority?: string | null;
  review_created_at?: string | null;
  review_progress?: ProgressStatus | null;
  last_review_date?: string | null;
}
