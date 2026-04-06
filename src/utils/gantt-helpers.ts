/**
 * @file gantt-helpers.ts
 * @description Fonctions utilitaires pour transformer les données vers le format SVAR Gantt.
 * Centralise le mapping des tâches et projets vers le format ITask de @svar-ui/react-gantt.
 */

import type { ITask } from '@svar-ui/react-gantt';

/**
 * Type de tâche interne (données brutes provenant de la base)
 */
export interface RawGanttTask {
  id: string;
  title: string;
  start_date?: string;
  due_date?: string;
  end_date?: string;
  status?: string;
  project_id?: string;
  parent_task_id?: string | null;
  type?: string;
  hideChildren?: boolean;
  dependencies?: string[];
  order_index?: number;
  completion?: number | null;
}

/**
 * Couleurs associées aux statuts des tâches
 */
const STATUS_COLORS: Record<string, string> = {
  todo: '#e2e8f0',
  in_progress: '#3b82f6',
  done: '#22c55e',
};

/**
 * Obtient la couleur CSS pour un statut donné
 */
export const getColorForStatus = (status?: string): string => {
  return STATUS_COLORS[status || ''] || '#94a3b8';
};

/**
 * Calcule la progression (0-100) selon le statut de la tâche
 */
const getProgressForStatus = (status?: string): number => {
  if (status === 'done') return 100;
  if (status === 'in_progress') return 50;
  return 0;
};

/**
 * Convertit un tableau de tâches brutes au format SVAR ITask
 * Utilisé par TaskGantt (vue tâches d'un seul projet)
 */
export const mapTasksToSvarFormat = (tasks: RawGanttTask[]): ITask[] => {
  if (!tasks || tasks.length === 0) return [];

  // Trier les tâches par order_index croissant avant le mapping
  const sorted = [...tasks].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  // Identifier les tâches qui possèdent réellement des enfants.
  // SVAR attend qu'une tâche "open" ou de type "summary" ait une hiérarchie valide.
  const parentTaskIds = new Set(
    sorted
      .map(task => task.parent_task_id)
      .filter((parentTaskId): parentTaskId is string => Boolean(parentTaskId))
  );

  return sorted.map(task => {
    // Dates de début et fin avec fallback
    let start = task.start_date ? new Date(task.start_date) : new Date();
    let end = task.due_date
      ? new Date(task.due_date)
      : task.end_date
        ? new Date(task.end_date)
        : new Date(start);

    // S'assurer que la date de fin est après le début
    if (end <= start) {
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    }

    // Utiliser completion si disponible (revue réelle), sinon fallback sur le statut
    const progress = task.completion !== undefined && task.completion !== null
      ? task.completion
      : getProgressForStatus(task.status);

    // Déterminer le type SVAR.
    // Une tâche parente doit être exposée comme "summary" pour éviter
    // les incohérences internes de la librairie sur les nœuds hiérarchiques.
    const hasChildren = parentTaskIds.has(task.id);
    const isProject = task.type === 'project' || (!task.parent_task_id && task.project_id === task.id);
    const isSummary = isProject || hasChildren;
    const type = isSummary ? 'summary' : 'task';

    const svarTask: ITask = {
      id: task.id,
      text: task.title,
      start,
      end,
      progress,
      type,
      // Une tâche sans enfants ne doit jamais être ouverte, sinon SVAR
      // tente d'itérer sur une collection interne nulle.
      open: hasChildren ? !task.hideChildren : false,
      parent: task.parent_task_id || (isSummary ? 0 : undefined),
    };

    return svarTask;
  });
};

/**
 * Formate une date en français
 */
export const formatDateFr = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
