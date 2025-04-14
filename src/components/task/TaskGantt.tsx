
import React, { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import { mapTasksToGanttFormat } from '@/utils/gantt-helpers';
import "gantt-task-react/dist/index.css";
import "@/styles/gantt.css";
import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarRange, Calendar } from "lucide-react";

interface TaskGanttProps {
  tasks: Array<any>;
  projectId: string;
  onEdit?: (task: any) => void;
}

export const TaskGantt: React.FC<TaskGanttProps> = ({ tasks, projectId, onEdit }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [showTaskList, setShowTaskList] = useState<boolean>(true);
  
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
    <div className="space-y-4 rounded-md border">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === ViewMode.Day ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Day)}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Jour
          </Button>
          <Button
            size="sm"
            variant={viewMode === ViewMode.Week ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Week)}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Semaine
          </Button>
          <Button
            size="sm"
            variant={viewMode === ViewMode.Month ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Month)}
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Mois
          </Button>
          <Button
            size="sm"
            variant={viewMode === ViewMode.Year ? "default" : "outline"}
            onClick={() => setViewMode(ViewMode.Year)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Année
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTaskList(!showTaskList)}
        >
          {showTaskList ? "Masquer liste des tâches" : "Afficher liste des tâches"}
        </Button>
      </div>

      {ganttTasks.length > 0 ? (
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          onDateChange={() => {}}
          onProgressChange={() => {}}
          onClick={handleTaskClick}
          listCellWidth={showTaskList ? "250px" : ""}
          columnWidth={60}
          locale="fr-FR" // Utilise une chaîne de caractères pour la locale au lieu d'un objet
          ganttHeight={500}
          TooltipContent={({ task }) => (
            <div className="bg-white p-2 rounded shadow-lg border">
              <h3 className="font-medium">{task.name}</h3>
              <p>Début: {task.start.toLocaleDateString('fr-FR')}</p>
              <p>Fin: {task.end.toLocaleDateString('fr-FR')}</p>
              <p>Progression: {task.progress}%</p>
            </div>
          )}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucune tâche pour ce projet
        </div>
      )}
    </div>
  );
};
