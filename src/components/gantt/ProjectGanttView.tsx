/**
 * @file ProjectGanttView.tsx
 * @description Vue Gantt macro pour afficher plusieurs projets et leurs tâches.
 * Utilise SVAR React Gantt pour le rendu interactif.
 * Lecture seule — pas de modification des dates depuis cette vue.
 */

import { useState, useRef } from 'react';
import { Gantt, Willow } from '@svar-ui/react-gantt';
import "@svar-ui/react-gantt/all.css";
import "@/styles/gantt.css";
import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarRange, Calendar, List } from "lucide-react";
import { GanttExportButtons } from './GanttExportButtons';
import { GanttLegend } from './GanttLegend';
import { ProjectGanttViewProps } from './types';

import type { ITask } from '@svar-ui/react-gantt';

/** Modes de vue disponibles */
type ViewModeKey = 'day' | 'week' | 'month' | 'year';

/** Configuration des échelles selon le mode */
const SCALES_CONFIG: Record<ViewModeKey, Array<{ unit: string; step: number; format: string }>> = {
  day: [
    { unit: 'month', step: 1, format: '%F %Y' },
    { unit: 'day', step: 1, format: '%j' },
  ],
  week: [
    { unit: 'month', step: 1, format: '%F %Y' },
    { unit: 'week', step: 1, format: '%d %M' },
  ],
  month: [
    { unit: 'year', step: 1, format: '%Y' },
    { unit: 'month', step: 1, format: '%F' },
  ],
  year: [
    { unit: 'year', step: 1, format: '%Y' },
  ],
};

/**
 * Transforme les projets et leurs tâches au format SVAR ITask
 */
const mapProjectsToSvarFormat = (
  projects: ProjectGanttViewProps['projects'],
  showTasks: boolean
): ITask[] => {
  const allTasks: ITask[] = [];

  // Tri des projets par date de début
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return dateA - dateB;
  });

  sortedProjects.forEach(project => {
    const projectStart = project.start_date ? new Date(project.start_date) : new Date();
    let projectEnd = project.end_date ? new Date(project.end_date) : new Date();
    if (projectEnd <= projectStart) {
      projectEnd = new Date(projectStart);
      projectEnd.setDate(projectEnd.getDate() + 30);
    }

    // Ajouter le projet comme tâche de type "summary"
    allTasks.push({
      id: project.id,
      text: project.title,
      start: projectStart,
      end: projectEnd,
      progress: project.completion || 0,
      type: 'summary',
      open: true,
      parent: 0,
    });

    // Ajouter les tâches du projet
    if (showTasks && project.tasks) {
      const sortedTasks = [...project.tasks].sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });

      sortedTasks.forEach(task => {
        let taskStart = task.start_date ? new Date(task.start_date) : new Date(projectStart);
        let taskEnd = task.due_date ? new Date(task.due_date) : new Date(taskStart);
        if (taskEnd <= taskStart) {
          taskEnd = new Date(taskStart);
          taskEnd.setDate(taskEnd.getDate() + 1);
        }

        let progress = 0;
        if (task.status === 'in_progress') progress = 50;
        if (task.status === 'done') progress = 100;

        allTasks.push({
          id: `${project.id}-${task.id}`,
          text: task.parent_task_id ? `  └ ${task.title}` : task.title,
          start: taskStart,
          end: taskEnd,
          progress,
          type: 'task',
          parent: project.id,
        });
      });
    }
  });

  return allTasks;
};

/**
 * Composant principal de la vue Gantt multi-projets
 */
export const ProjectGanttView = ({ projects }: ProjectGanttViewProps) => {
  const [viewMode, setViewMode] = useState<ViewModeKey>('month');
  const [showTasks, setShowTasks] = useState<boolean>(false);
  const ganttRef = useRef<HTMLDivElement>(null);

  const svarTasks = mapProjectsToSvarFormat(projects, showTasks);

  // Données pour l'export
  const exportData = svarTasks.map(t => ({
    name: t.text || '',
    start: t.start || new Date(),
    end: t.end || new Date(),
    progress: t.progress || 0,
    type: t.type || 'task',
  }));

  if (svarTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Aucun projet avec des dates à afficher
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-wrap justify-between items-center gap-2 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-wrap gap-2">
          {(['day', 'week', 'month', 'year'] as ViewModeKey[]).map(mode => (
            <Button
              key={mode}
              size="sm"
              variant={viewMode === mode ? "default" : "outline"}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'day' && <CalendarDays className="h-4 w-4 mr-2" />}
              {mode === 'week' && <CalendarDays className="h-4 w-4 mr-2" />}
              {mode === 'month' && <CalendarRange className="h-4 w-4 mr-2" />}
              {mode === 'year' && <Calendar className="h-4 w-4 mr-2" />}
              {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : mode === 'month' ? 'Mois' : 'Année'}
            </Button>
          ))}

          <div className="w-px h-8 bg-border mx-2" />

          <Button
            size="sm"
            variant={showTasks ? "default" : "outline"}
            onClick={() => setShowTasks(!showTasks)}
          >
            <List className="h-4 w-4 mr-2" />
            {showTasks ? "Masquer tâches" : "Afficher tâches"}
          </Button>
        </div>

        <GanttExportButtons
          tasks={exportData}
          ganttRef={ganttRef}
        />
      </div>

      <GanttLegend showTasks={showTasks} />

      {/* Diagramme de Gantt SVAR */}
      <div ref={ganttRef} className="svar-gantt-wrapper">
        <Willow>
          <Gantt
            tasks={svarTasks}
            links={[]}
            scales={SCALES_CONFIG[viewMode]}
            readonly={true}
            cellHeight={36}
          />
        </Willow>
      </div>
    </div>
  );
};
