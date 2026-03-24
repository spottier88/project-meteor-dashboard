/**
 * @file types.ts
 * @description Définit les interfaces TypeScript pour le diagramme de Gantt.
 * Types utilisés pour la vue multi-projets avec SVAR React Gantt.
 */

import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from '@/types/project';

/**
 * Props du composant ProjectGanttView
 */
export interface ProjectGanttViewProps {
  /** Liste des projets à afficher dans le Gantt */
  projects: Array<{
    /** ID unique du projet */
    id: string;
    /** Titre du projet */
    title: string;
    /** Date de début (format ISO) */
    start_date?: string;
    /** Date de fin (format ISO) */
    end_date?: string;
    /** Statut météo du projet */
    status?: ProjectStatus;
    /** Statut de progression */
    progress?: ProgressStatus;
    /** Statut du cycle de vie */
    lifecycle_status: ProjectLifecycleStatus;
    /** Pourcentage de complétion */
    completion?: number;
    /** Liste des tâches du projet */
    tasks?: Array<{
      /** ID unique de la tâche */
      id: string;
      /** Titre de la tâche */
      title: string;
      /** Date de début (format ISO) */
      start_date?: string;
      /** Date d'échéance (format ISO) */
      due_date?: string;
      /** Statut de la tâche */
      status: "todo" | "in_progress" | "done";
      /** ID de la tâche parente (pour sous-tâches) */
      parent_task_id?: string;
    }>;
  }>;
}
