import React, { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import { mapTasksToGanttFormat } from '@/utils/gantt-helpers';
import "gantt-task-react/dist/index.css";
import "@/styles/gantt.css";
import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

interface TaskGanttProps {
  tasks: Array<any>;
  projectId: string;
  onEdit?: (task: any) => void;
  onUpdate?: () => void;
  onExpanderClick?: (task: any) => void; // Propriété pour gérer l'expansion
}

export const TaskGantt: React.FC<TaskGanttProps> = ({ tasks, projectId, onEdit, onUpdate, onExpanderClick }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [showTaskList, setShowTaskList] = useState<boolean>(true);
  const [localTasks, setLocalTasks] = useState<Array<any>>(tasks);
  
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  const ganttTasks = mapTasksToGanttFormat(localTasks);
  
  const handleDateChange = async (task: Task) => {
    try {
      const startDate = task.start.toISOString().split('T')[0];
      const endDate = task.end.toISOString().split('T')[0];
      
      const { error, data } = await supabase
        .from('tasks')
        .update({
          start_date: startDate,
          due_date: endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select();

      if (error) throw error;

      setLocalTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id 
            ? { ...t, start_date: startDate, due_date: endDate } 
            : t
        )
      );
      
      toast.success('Dates de la tâche mises à jour');
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des dates:' + error);
      toast.error("Erreur lors de la mise à jour des dates");
    }
  };

  const handleTaskDoubleClick = (task: Task) => {
    if (onEdit) {
      const originalTask = localTasks.find(t => t.id === task.id);
      if (originalTask) {
        onEdit(originalTask);
      }
    }
  };

  const handleExpanderClick = (task: Task) => {
    if (onExpanderClick) {
      onExpanderClick(task);
    }
  };

  let columnWidth = 65;
  if (viewMode === ViewMode.Year) {
    columnWidth = 250;
  } else if (viewMode === ViewMode.Month) {
    columnWidth = 200;
  } else if (viewMode === ViewMode.Week) {
    columnWidth = 100;
  }

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
          onDateChange={handleDateChange}
          onProgressChange={() => {}}
          onDoubleClick={handleTaskDoubleClick}
          onExpanderClick={handleExpanderClick}
          listCellWidth={showTaskList ? "250px" : ""}
          columnWidth={columnWidth}
          locale="fr-FR"
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
