
/**
 * @file types.ts
 * @description Définit les interfaces TypeScript pour le diagramme de Gantt.
 * Contient les définitions pour les tâches, les liens entre tâches et les propriétés
 * nécessaires pour représenter les projets et leurs tâches sous forme de diagramme.
 */

import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from '@/types/project';
import { Task } from 'gantt-task-react';

// Type étendu pour les tâches Gantt utilisées dans notre application
export interface GanttTask extends Task {
  lifecycle_status?: ProjectLifecycleStatus;
  completion?: number;
  status?: ProjectStatus;
  // Modifié: Renommé progress (du Task) en taskProgress pour éviter le conflit
  // Car progress dans l'interface Task est un number, alors que ProgressStatus est un string
  taskProgress?: ProgressStatus;
  _isMilestone?: boolean;
}

export interface GanttLink {
  id: string;
  source: string;
  target: string;
  type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export interface ProjectGanttViewProps {
  projects: Array<{
    id: string;
    title: string;
    start_date?: string;
    end_date?: string;
    status?: ProjectStatus;
    progress?: ProgressStatus;
    lifecycle_status: ProjectLifecycleStatus;
    completion?: number;
    tasks?: Array<{
      id: string;
      title: string;
      start_date?: string;
      due_date?: string;
      status: "todo" | "in_progress" | "done";
      parent_task_id?: string;
    }>;
  }>;
}
