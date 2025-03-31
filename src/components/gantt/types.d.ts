
import { Task as GanttReactTask } from '@wamra/gantt-task-react';

// Définir une interface pour les dépendances selon la bibliothèque
export interface Dependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: number;
}

// Ajoutons une extension du type Task de gantt-task-react pour notre utilisation spécifique
export interface ExtendedGanttTask extends GanttReactTask {
  _isMilestone?: boolean;
  project?: string; // Ajout de la propriété project pour la relation parent-enfant
}

// Conservons les interfaces existantes telles quelles pour la compatibilité
/**
 * @file types.ts
 * @description Définit les interfaces TypeScript pour le diagramme de Gantt.
 * Contient les définitions pour les tâches, les liens entre tâches et les propriétés
 * nécessaires pour représenter les projets et leurs tâches sous forme de diagramme.
 */

import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from '@/types/project';

export interface GanttTask {
  id: string;
  start: Date;
  end: Date;
  name: string;
  color: string;
  type: 'project' | 'task' | 'subtask' | 'separator' | 'milestone';
  project_id?: string;
  parent_id?: string;
  parent_task_id?: string;
  status?: ProjectStatus;
  progress?: ProgressStatus;
  lifecycle_status?: ProjectLifecycleStatus;
  completion?: number;
  isDisabled?: boolean;
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
