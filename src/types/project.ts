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