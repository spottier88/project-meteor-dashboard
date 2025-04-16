
import React, { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import { mapTasksToGanttFormat } from '@/utils/gantt-helpers';
import "gantt-task-react/dist/index.css";
import "@/styles/gantt.css";
import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskGanttProps {
  tasks: Array<any>;
  projectId: string;
  onEdit?: (task: any) => void;
  onUpdate?: () => void; // Nouvelle prop pour notifier le parent qu'une tâche a été mise à jour
}

export const TaskGantt: React.FC<TaskGanttProps> = ({ tasks, projectId, onEdit, onUpdate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [showTaskList, setShowTaskList] = useState<boolean>(true);
  const [localTasks, setLocalTasks] = useState<Array<any>>(tasks);
  
  // Mettre à jour l'état local lorsque les props changent
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  // Convertir les tâches au format attendu par le composant Gantt
  const ganttTasks = mapTasksToGanttFormat(localTasks);
  
  // Gérer le changement de date d'une tâche
  const handleDateChange = async (task: Task) => {
    console.log("Date change detected:", task.id, task.start, task.end);
    
    // Trouver la tâche originale correspondante
    const originalTask = localTasks.find(t => t.id === task.id);
    if (!originalTask) {
      console.error("Tâche originale non trouvée:", task.id);
      return;
    }

    try {
      // Formatage des dates pour la base de données
      const startDate = task.start.toISOString().split('T')[0];
      const endDate = task.end.toISOString().split('T')[0];
      
      console.log("Mise à jour des dates:", startDate, endDate);
      
      // Mettre à jour la tâche dans la base de données
      const { error, data } = await supabase
        .from('tasks')
        .update({
          start_date: startDate,
          due_date: endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select();

      if (error) {
        console.error('Erreur lors de la mise à jour des dates:', error);
        throw error;
      }

      console.log('Mise à jour réussie, données retournées:', data);
      
      // Mettre à jour l'état local avec les nouvelles données
      setLocalTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id 
            ? { ...t, start_date: startDate, due_date: endDate } 
            : t
        )
      );
      
      toast.success('Dates de la tâche mises à jour');
      
      // Notifier le parent qu'une mise à jour a eu lieu
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des dates:', error);
      toast.error("Erreur lors de la mise à jour des dates");
    }
  };

  // Gérer le double-clic sur une tâche pour l'édition
  const handleTaskDoubleClick = (task: Task) => {
    if (onEdit) {
      // Trouver la tâche originale correspondante
      const originalTask = localTasks.find(t => t.id === task.id);
      if (originalTask) {
        onEdit(originalTask);
      }
    }
  };

  // Définir la largeur des colonnes en fonction du mode de vue
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
