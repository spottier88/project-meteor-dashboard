
import React, { useRef, useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { GanttViewButtons } from './GanttViewButtons';
import { GanttExportButtons } from './GanttExportButtons';
import { GanttLegend } from './GanttLegend';
import { ProjectGanttViewProps } from './types';

export const ProjectGanttView = ({ projects }: ProjectGanttViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showTasks, setShowTasks] = useState(false);
  const [columnWidth, setColumnWidth] = useState(300); // Valeur par défaut pour le mode Mois
  const ganttRef = useRef<HTMLDivElement>(null);

  const getColorForStatus = (status: string, isProject: boolean = false) => {
    if (isProject) {
      return '#9b87f5';
    }
    
    switch (status) {
      case 'todo':
        return '#F2FCE2';
      case 'in_progress':
        return '#D3E4FD';
      case 'done':
        return '#E2E8F0';
      default:
        return '#F3F4F6';
    }
  };

  // Fonction pour générer les tâches au format attendu par gantt-task-react
  const generateGanttTasks = (): Task[] => {
    const tasks: Task[] = [];
    
    // Tri des projets par date de début
    const sortedProjects = [...projects].sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      return dateA - dateB;
    });
    
    // Ajouter les projets comme tâches principales
    sortedProjects.forEach((project) => {
      const projectStartDate = project.start_date ? new Date(project.start_date) : new Date();
      const projectEndDate = project.end_date ? new Date(project.end_date) : new Date();
      
      // Transforme le ProgressStatus en valeur numérique pour le composant Gantt
      let progressValue = 0;
      if (project.progress === 'better') {
        progressValue = 100;
      } else if (project.progress === 'stable') {
        progressValue = 50;
      }
      
      // Ajouter le projet comme tâche principale
      tasks.push({
        id: project.id,
        name: project.title,
        start: projectStartDate,
        end: projectEndDate,
        progress: progressValue,
        type: 'project',
        hideChildren: !showTasks,
        styles: {
          backgroundColor: '#9b87f5',
          progressColor: '#7a66d4',
        },
      });
      
      // Ajouter les tâches si showTasks est true et si des tâches existent
      if (showTasks && project.tasks && project.tasks.length > 0) {
        // Filtrer les tâches parentes (sans parent_task_id)
        const parentTasks = project.tasks
          .filter(task => !task.parent_task_id)
          .sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateA - dateB;
          });
        
        // Ajouter les tâches parentes
        parentTasks.forEach(task => {
          const taskId = `${project.id}-${task.id}`;
          const taskStartDate = task.start_date ? new Date(task.start_date) : projectStartDate;
          const taskEndDate = task.due_date ? new Date(task.due_date) : projectEndDate;
          
          const isJalon = !task.start_date || (task.start_date === task.due_date);
          
          tasks.push({
            id: taskId,
            name: task.title,
            start: taskStartDate,
            end: taskEndDate,
            progress: task.status === 'done' ? 100 : (task.status === 'in_progress' ? 50 : 0),
            type: isJalon ? 'milestone' : 'task',
            project: project.id,
            dependencies: [project.id],
            styles: {
              backgroundColor: getColorForStatus(task.status),
              progressColor: '#a3a3a3',
            },
          });
          
          // Filtrer les sous-tâches pour cette tâche parente
          const childTasks = project.tasks
            .filter(childTask => childTask.parent_task_id === task.id)
            .sort((a, b) => {
              const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
              const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
              return dateA - dateB;
            });
          
          // Ajouter les sous-tâches
          childTasks.forEach(childTask => {
            const childTaskId = `${project.id}-${childTask.id}`;
            const childStartDate = childTask.start_date ? new Date(childTask.start_date) : taskStartDate;
            const childEndDate = childTask.due_date ? new Date(childTask.due_date) : taskEndDate;
            
            const isChildJalon = !childTask.start_date || (childTask.start_date === childTask.due_date);
            
            tasks.push({
              id: childTaskId,
              name: childTask.title,
              start: childStartDate,
              end: childEndDate,
              progress: childTask.status === 'done' ? 100 : (childTask.status === 'in_progress' ? 50 : 0),
              type: isChildJalon ? 'milestone' : 'task',
              project: taskId,
              dependencies: [taskId],
              styles: {
                backgroundColor: getColorForStatus(childTask.status),
                progressColor: '#a3a3a3',
              },
            });
          });
        });
      }
    });
    
    return tasks;
  };

  const handleViewModeChange = (mode: 'week' | 'month' | 'year') => {
    switch (mode) {
      case 'week':
        setViewMode(ViewMode.Week);
        setColumnWidth(250);
        break;
      case 'month':
        setViewMode(ViewMode.Month);
        setColumnWidth(300);
        break;
      case 'year':
        setViewMode(ViewMode.Year);
        setColumnWidth(350);
        break;
    }
  };

  // Préparer les tâches pour le Gantt
  const ganttTasks = generateGanttTasks();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <GanttViewButtons
          mode={viewMode === ViewMode.Week ? 'week' : (viewMode === ViewMode.Month ? 'month' : 'year')}
          showTasks={showTasks}
          onViewModeChange={handleViewModeChange}
          onShowTasksChange={setShowTasks}
        />
        <GanttExportButtons tasks={ganttTasks} ganttRef={ganttRef} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <GanttLegend showTasks={showTasks} />

        <div ref={ganttRef} className="h-[600px] w-full overflow-x-auto">
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            listCellWidth={showTasks ? "150" : "0"} // Utilisation 0 pour masquer la colonne des titres
            columnWidth={columnWidth}
            ganttHeight={550}
            rowHeight={50}
            barCornerRadius={14}
            handleWidth={8}
            fontFamily="Arial, sans-serif"
            TooltipContent={({ task }) => (
              <div className="p-2 bg-white shadow rounded border">
                <div><strong>{task.name}</strong></div>
                <div>Début: {task.start.toLocaleDateString('fr-FR')}</div>
                <div>Fin: {task.end.toLocaleDateString('fr-FR')}</div>
                <div>Statut: {
                  task.progress === 100 ? 'Terminé' : 
                  (task.progress > 0 ? 'En cours' : 'À faire')
                }</div>
              </div>
            )}
            locale="fr"
            arrowColor="#777"
            todayColor="rgba(252, 220, 0, 0.4)"
            barProgressColor="#a3a3a3"
            projectProgressColor="#7db59a"
            projectProgressSelectedColor="#59a985"
          />
        </div>
      </div>
    </div>
  );
};
