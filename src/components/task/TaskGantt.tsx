
import React, { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import { mapTasksToGanttFormat } from '@/utils/gantt-helpers';
import "gantt-task-react/dist/index.css";
import "@/styles/gantt.css";

interface TaskGanttProps {
  tasks: Array<any>;
  projectId: string;
  onEdit?: (task: any) => void;
}

export const TaskGantt: React.FC<TaskGanttProps> = ({ tasks, projectId, onEdit }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  
  // Convertir les tâches au format attendu par le composant Gantt
  const ganttTasks = mapTasksToGanttFormat(tasks);
  
  // Gérer le clic sur une tâche
  const handleTaskClick = (task: Task) => {
    if (onEdit) {
      // Trouver la tâche originale correspondante
      const originalTask = tasks.find(t => t.id === task.id);
      if (originalTask) {
        onEdit(originalTask);
      }
    }
  };
  
  return (
    <div className="rounded-md border">
      {ganttTasks.length > 0 ? (
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          onDateChange={() => {}}
          onProgressChange={() => {}}
          onClick={handleTaskClick}
          listCellWidth="250px"
          columnWidth={60}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucune tâche pour ce projet
        </div>
      )}
    </div>
  );
};
