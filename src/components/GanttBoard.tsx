
import { useEffect, useState, useMemo } from 'react';
import { Gantt } from 'wx-react-gantt';
import { 
  convertTasksToGanttFormat, 
  createDependenciesFromTasks,
  createDefaultColumns
} from './gantt-wx/TaskAdapter';
import { Skeleton } from '@/components/ui/skeleton';
import { GanttBoardProps } from './gantt-wx/types';
// Importer le bon fichier CSS
import 'wx-react-gantt/dist/gantt.css';
import './gantt-wx/gantt-custom.css';

export const GanttBoard = ({ 
  tasks = [], 
  projectId,
  readOnly = false,
  onEditTask 
}: GanttBoardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Convertir les tâches et créer les dépendances
  const ganttTasks = useMemo(() => {
    try {
      return convertTasksToGanttFormat(tasks);
    } catch (err) {
      console.error("Erreur lors de la conversion des tâches:", err);
      setError("Erreur de conversion des tâches");
      return [];
    }
  }, [tasks]);
  
  const ganttDependencies = useMemo(() => {
    try {
      return createDependenciesFromTasks(tasks);
    } catch (err) {
      console.error("Erreur lors de la création des dépendances:", err);
      return [];
    }
  }, [tasks]);
  
  const columns = useMemo(() => createDefaultColumns(), []);
  
  // Gérer le chargement initial
  useEffect(() => {
    if (tasks) {
      setIsLoading(false);
    }
  }, [tasks]);
  
  // Gérer les clics sur les tâches
  const handleTaskClick = (taskId: string | number) => {
    if (readOnly || !onEditTask) return;
    
    const originalTask = tasks.find(t => t.id === taskId);
    if (originalTask) {
      onEditTask(originalTask);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!tasks.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
        <p className="text-muted-foreground">Aucune tâche à afficher dans le diagramme Gantt</p>
      </div>
    );
  }

  return (
    <div className="gantt-board-container bg-white rounded-lg shadow border">
      <Gantt
        tasks={ganttTasks}
        dependencies={ganttDependencies}
        columns={columns}
        viewMode="day"
        onTaskClick={handleTaskClick}
        viewDate={new Date()}
        listCellWidth="auto"
        ganttHeight={500}
        locale={{
          name: 'fr',
          weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
          months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
          weekStartOn: 1,
          weekMinWidth: 20,
          quarterPrefix: 'T'
        }}
      />
    </div>
  );
};
