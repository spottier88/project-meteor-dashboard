
import { useEffect, useRef, useState } from 'react';
import { Gantt } from 'wx-react-gantt';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/utils/formatUserName';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { GanttViewButtons } from '@/components/gantt/GanttViewButtons';
import { GanttLegend } from '@/components/gantt/GanttLegend';
import { convertTaskToGantt } from './TaskAdapter';
import { logger } from '@/utils/logger';
import "wx-react-gantt/dist/gantt.css";

interface WxGanttViewProps {
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    assignee?: string;
    due_date?: string;
    start_date?: string;
    project_id: string;
    parent_task_id?: string | null;
  }>;
  projectId: string;
  readOnly?: boolean;
  onEditTask?: (task: any) => void;
}

export const WxGanttView = ({ tasks, projectId, readOnly = false, onEditTask }: WxGanttViewProps) => {
  const [showTasks, setShowTasks] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const ganttRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const { data: projectMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      console.log(`Récupération des membres pour le projet ${projectId}`);
      
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("project_id", projectId);

      if (error) {
        console.error("Erreur lors de la récupération des membres du projet:", error);
        throw error;
      }
      
      const { data: project } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .maybeSingle();
      
      if (project?.project_manager) {
        const { data: pmProfile } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("email", project.project_manager)
          .maybeSingle();
          
        if (pmProfile) {
          const isAlreadyInList = data?.some(m => m.profiles?.email === pmProfile.email);
          if (!isAlreadyInList) {
            data?.push({
              user_id: pmProfile.id,
              profiles: pmProfile
            });
          }
        }
      }
      
      console.log(`Récupération de ${data?.length || 0} membres pour le projet ${projectId}`);
      return data || [];
    },
    enabled: !!projectId,
  });

  const profiles = projectMembers?.map(member => member.profiles) || [];

  const formatTasks = () => {
    console.log("Début du formatage des tâches pour Gantt");
    console.log("Nombre de tâches disponibles:", tasks?.length || 0);
    
    if (!tasks || tasks.length === 0) {
      console.log("Aucune tâche à afficher dans le Gantt");
      return [];
    }
    
    try {
      const ganttTasks = [];
      
      // Trier les tâches parentes par date
      const parentTasks = tasks
        .filter(task => !task.parent_task_id)
        .sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        });
      
      console.log(`Nombre de tâches principales: ${parentTasks.length}`);
      
      // Traiter les tâches parentes et leurs enfants
      for (const task of parentTasks) {
        try {
          const assigneeName = task.assignee ? formatUserName(task.assignee, profiles) : '';
          const ganttTask = convertTaskToGantt(task, assigneeName, readOnly);
          
          if (ganttTask) {
            ganttTasks.push(ganttTask);
            
            // Trouver et ajouter les tâches enfants
            const childTasks = tasks
              .filter(childTask => childTask.parent_task_id === task.id)
              .sort((a, b) => {
                const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
                const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
                return dateA - dateB;
              });
            
            console.log(`Tâche ${task.id} (${task.title}) a ${childTasks.length} sous-tâches`);
            
            for (const childTask of childTasks) {
              try {
                const childAssigneeName = childTask.assignee ? formatUserName(childTask.assignee, profiles) : '';
                const ganttChildTask = convertTaskToGantt(childTask, childAssigneeName, readOnly);
                
                if (ganttChildTask) {
                  ganttTasks.push(ganttChildTask);
                }
              } catch (error) {
                console.error(`Erreur lors de la conversion de la sous-tâche ${childTask.id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la conversion de la tâche principale ${task.id}:`, error);
        }
      }

      console.log(`Total des tâches formatées pour Gantt: ${ganttTasks.length}`);
      console.log("Structure des tâches pour Gantt:", ganttTasks);
      return ganttTasks;
    } catch (error) {
      console.error("Erreur lors du formatage des tâches pour Gantt:", error);
      return [];
    }
  };

  const handleTaskClick = (taskId: string) => {
    if (isDragging || readOnly) return;
    console.log("Clic sur la tâche:", taskId);
    
    const originalTask = tasks.find(t => t.id === taskId);
    if (originalTask && onEditTask) {
      onEditTask(originalTask);
    }
  };

  const handleViewModeChange = (mode: 'week' | 'month' | 'year') => {
    console.log("Changement de mode vue:", mode);
    switch (mode) {
      case 'week':
        setViewMode('day');
        break;
      case 'month':
        setViewMode('week');
        break;
      case 'year':
        setViewMode('month');
        break;
    }
  };

  const handleShowTasksChange = (value: boolean) => {
    console.log("Affichage des tâches:", value);
    setShowTasks(value);
  };

  const updateTaskDates = async (taskId: string, startDate: Date, endDate: Date) => {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      console.log(`Mise à jour des dates: tâche ${taskId}, début: ${formattedStartDate}, fin: ${formattedEndDate}`);
      
      const { error } = await supabase
        .from('tasks')
        .update({
          start_date: formattedStartDate,
          due_date: formattedEndDate
        })
        .eq('id', taskId);
      
      if (error) throw error;
      
      toast({
        title: 'Tâche mise à jour',
        description: `Dates ajustées : du ${format(startDate, 'dd/MM/yyyy')} au ${format(endDate, 'dd/MM/yyyy')}`,
      });
      
      if (onEditTask) {
        onEditTask(null); // Rafraîchir les données
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des dates:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les dates de la tâche',
        variant: 'destructive',
      });
    }
  };

  const formatDateString = (dateStr: string | null): string => {
    if (!dateStr) return 'Non définie';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  };

  // Configuration simplifiée du Gantt selon la documentation
  const ganttConfig = {
    readonly: readOnly,
    scales: [
      { unit: 'month', step: 1, format: 'MMMM yyyy' }
    ]
  };

  const formattedTasks = formatTasks();

  useEffect(() => {
    console.log("Tasks disponibles pour le Gantt:", tasks?.length || 0);
    console.log("Tasks formatées pour le Gantt:", formattedTasks.length);
  }, [tasks, formattedTasks.length]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <GanttViewButtons
          mode={viewMode === 'day' ? 'week' : viewMode === 'week' ? 'month' : 'year'}
          showTasks={showTasks}
          onViewModeChange={handleViewModeChange}
          onShowTasksChange={handleShowTasksChange}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <GanttLegend showTasks={true} />

        <div ref={ganttRef} className="h-[600px] w-full overflow-x-auto">
          {formattedTasks.length > 0 ? (
            <Gantt
              tasks={formattedTasks}
              config={ganttConfig}
              onTaskClick={handleTaskClick}
              onTaskDblClick={handleTaskClick}
              onAfterTaskDrag={(taskId, startDate, endDate) => {
                console.log("Fin du glisser-déposer:", taskId, startDate, endDate);
                if (!readOnly) {
                  setIsDragging(false);
                  updateTaskDates(taskId, new Date(startDate), new Date(endDate));
                }
              }}
              onBeforeTaskDrag={() => {
                console.log("Début du glisser-déposer, readOnly:", readOnly);
                setIsDragging(true);
                return !readOnly;
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Aucune tâche à afficher dans le diagramme Gantt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
