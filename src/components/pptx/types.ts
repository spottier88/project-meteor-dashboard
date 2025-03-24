/**
 * @file types.ts
 * @description Définit les types TypeScript pour la génération de présentations PPTX.
 * Contient les interfaces pour la structure des données de projet, revues, risques
 * et tâches nécessaires à la génération des diapositives de présentation.
 */

import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from "@/types/project";

export interface ProjectData {
  project: {
    title: string;
    status: ProjectStatus;
    progress: ProgressStatus;
    completion: number;
    project_manager?: string;
    last_review_date: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    pole_name?: string;
    direction_name?: string;
    service_name?: string;
    lifecycle_status: ProjectLifecycleStatus;
  };
  lastReview?: {
    weather: "sunny" | "cloudy" | "stormy";
    progress: "better" | "stable" | "worse";
    comment?: string;
    created_at: string;
    actions?: Array<{
      description: string;
    }>;
  };
  risks: Array<{
    description: string;
    probability: "low" | "medium" | "high";
    severity: "low" | "medium" | "high";
    status: "open" | "in_progress" | "resolved";
    mitigation_plan?: string;
  }>;
  tasks: Array<{
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    assignee?: string;
    due_date?: string;
  }>;
}
