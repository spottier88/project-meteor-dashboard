
import { useEffect, useRef, useState } from 'react';
import { Gantt } from '@dhtmlx/trial-react-gantt';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/utils/formatUserName';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { GanttViewButtons } from '@/components/gantt/GanttViewButtons';
import { GanttLegend } from '@/components/gantt/GanttLegend';

interface DHtmlxGanttViewProps {
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

export const DHtmlxGanttView = ({ tasks, projectId, readOnly = false, onEditTask }: DHtmlxGanttViewProps) => {
  const [showTasks, setShowTasks] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const ganttRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: projectMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
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

      if (error) throw error;
      
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
      
      return data || [];
    },
    enabled: !!projectId,
  });

  const profiles = projectMembers?.map(member => member.profiles) || [];

  const getColorForStatus = (status: string) => {
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

  const formatTasks = () => {
    const dhtmlxTasks: any[] = [];
    
    // Formatter les tâches principales
    const parentTasks = tasks
      .filter(task => !task.parent_task_id)
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
    
    parentTasks.forEach(task => {
      const hasStartDate = !!task.start_date;
      const taskStartDate = task.start_date ? new Date(task.start_date) : 
                          (task.due_date ? new Date(task.due_date) : new Date());
      const taskEndDate = task.due_date ? new Date(task.due_date) : new Date();
      
      const isJalon = !hasStartDate || (task.start_date === task.due_date);
      
      dhtmlxTasks.push({
        id: task.id,
        text: `${task.title} ${task.assignee ? `- ${formatUserName(task.assignee, profiles)}` : ''}`,
        start_date: taskStartDate,
        end_date: taskEndDate,
        progress: task.status === 'done' ? 1 : task.status === 'in_progress' ? 0.5 : 0,
        type: isJalon ? 'milestone' : 'task',
        color: getColorForStatus(task.status),
        parent: 0,
        readonly: readOnly
      });

      // Formatter les sous-tâches
      const childTasks = tasks
        .filter(childTask => childTask.parent_task_id === task.id)
        .sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        });
      
      childTasks.forEach(childTask => {
        const hasChildStartDate = !!childTask.start_date;
        const childStartDate = childTask.start_date ? new Date(childTask.start_date) : 
                              (childTask.due_date ? new Date(childTask.due_date) : taskStartDate);
        const childEndDate = childTask.due_date ? new Date(childTask.due_date) : taskEndDate;
        
        const isChildJalon = !hasChildStartDate || (childTask.start_date === childTask.due_date);
        
        dhtmlxTasks.push({
          id: childTask.id,
          text: `${childTask.title} ${childTask.assignee ? `- ${formatUserName(childTask.assignee, profiles)}` : ''}`,
          start_date: childStartDate,
          end_date: childEndDate,
          progress: childTask.status === 'done' ? 1 : childTask.status === 'in_progress' ? 0.5 : 0,
          type: isChildJalon ? 'milestone' : 'task',
          color: getColorForStatus(childTask.status),
          parent: task.id,
          readonly: readOnly
        });
      });
    });

    return dhtmlxTasks;
  };

  const handleTaskClick = (taskId: string) => {
    if (isDragging || readOnly) return;
    
    const originalTask = tasks.find(t => t.id === taskId);
    if (originalTask && onEditTask) {
      onEditTask(originalTask);
    }
  };

  const handleViewModeChange = (mode: 'week' | 'month' | 'year') => {
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
    setShowTasks(value);
  };

  const updateTaskDates = async (taskId: string, startDate: Date, endDate: Date) => {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
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
        onEditTask(null);
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

  // Configuration du Gantt DHTMLX
  const ganttConfig = {
    locale: 'fr',
    readonly: readOnly,
    scales: [
      { unit: 'month', step: 1, format: 'MMMM yyyy' },
      { unit: viewMode, step: 1 }
    ],
    columns: [
      { name: 'text', label: 'Tâche', width: showTasks ? '300px' : '0px' },
      { name: 'start_date', label: 'Début', width: showTasks ? '120px' : '0px' },
      { name: 'end_date', label: 'Fin', width: showTasks ? '120px' : '0px' },
    ],
    taskTooltipTemplate: (task: any) => {
      return `
        <div class="p-2 bg-white shadow rounded border">
          <div><strong>${task.text}</strong></div>
          <div>Début: ${format(new Date(task.start_date), 'dd/MM/yyyy')}</div>
          <div>Fin: ${format(new Date(task.end_date), 'dd/MM/yyyy')}</div>
          <div>Statut: ${task.progress === 1 ? 'Terminé' : task.progress > 0 ? 'En cours' : 'À faire'}</div>
        </div>
      `;
    }
  };

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
          <Gantt
            tasks={formatTasks()}
            config={ganttConfig}
            onTaskClick={handleTaskClick}
            onTaskDblClick={handleTaskClick}
            onAfterTaskDrag={(taskId, startDate, endDate) => {
              if (!readOnly) {
                setIsDragging(false);
                updateTaskDates(taskId, new Date(startDate), new Date(endDate));
              }
            }}
            onBeforeTaskDrag={() => {
              setIsDragging(true);
              return !readOnly;
            }}
          />
        </div>
      </div>
    </div>
  );
};
