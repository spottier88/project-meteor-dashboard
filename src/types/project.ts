
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
}
