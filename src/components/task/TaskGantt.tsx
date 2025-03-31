
import { useEffect, useRef, useState } from 'react';
import { Gantt, Task, ViewMode, StylingOption } from '@wamra/gantt-task-react';
import "@wamra/gantt-task-react/dist/index.css";
import { GanttViewButtons } from '@/components/gantt/GanttViewButtons';
import { GanttLegend } from '@/components/gantt/GanttLegend';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/utils/formatUserName';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ExtendedGanttTask } from '@/components/gantt/types.d';

interface TaskGanttProps {
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

interface ExtendedTask extends Task {
  _isMilestone?: boolean;
}

// Type définissant la structure d'une dépendance dans cette version de Gantt
type Dependency = string;

export const TaskGantt = ({ tasks, projectId, readOnly = false, onEditTask }: TaskGanttProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showTasks, setShowTasks] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [columnWidth, setColumnWidth] = useState(300);
  const ganttRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setViewMode(prev => prev);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [showTasks]);

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

  const generateGanttTasks = (): ExtendedTask[] => {
    const ganttTasks: ExtendedTask[] = [];
    
    const parentTasks = tasks
      .filter(task => !task.parent_task_id)
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
    
    parentTasks.forEach(task => {
      const taskId = task.id;
      const hasStartDate = !!task.start_date;
      const taskStartDate = task.start_date ? new Date(task.start_date) : 
                          (task.due_date ? new Date(task.due_date) : new Date());
      const taskEndDate = task.due_date ? new Date(task.due_date) : new Date();
      
      const isJalon = !hasStartDate || (task.start_date === task.due_date);
      
      ganttTasks.push({
        id: taskId,
        name: `${task.title} ${task.assignee ? `- ${formatUserName(task.assignee, profiles)}` : ''}`,
        start: taskStartDate,
        end: taskEndDate,
        progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
        type: isJalon ? 'milestone' : 'task',
        styles: {
          barBackgroundColor: getColorForStatus(task.status),
          barProgressColor: '#a3a3a3',
        },
        isDisabled: readOnly,
        _isMilestone: isJalon
      });
      
      const childTasks = tasks
        .filter(childTask => childTask.parent_task_id === task.id)
        .sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        });
      
      childTasks.forEach(childTask => {
        const childTaskId = childTask.id;
        const hasChildStartDate = !!childTask.start_date;
        const childStartDate = childTask.start_date ? new Date(childTask.start_date) : 
                              (childTask.due_date ? new Date(childTask.due_date) : taskStartDate);
        const childEndDate = childTask.due_date ? new Date(childTask.due_date) : taskEndDate;
        
        const isChildJalon = !hasChildStartDate || (childTask.start_date === childTask.due_date);
        
        ganttTasks.push({
          id: childTaskId,
          name: `   ${childTask.title} ${childTask.assignee ? `- ${formatUserName(childTask.assignee, profiles)}` : ''}`,
          start: childStartDate,
          end: childEndDate,
          progress: childTask.status === 'done' ? 100 : childTask.status === 'in_progress' ? 50 : 0,
          type: isChildJalon ? 'milestone' : 'task',
          project: taskId,
          // Dans cette version de la bibliothèque, les dépendances sont des chaînes simples
          dependencies: taskId ? [taskId] : [],
          styles: {
            barBackgroundColor: getColorForStatus(childTask.status),
            barProgressColor: '#a3a3a3',
          },
          isDisabled: readOnly,
          _isMilestone: isChildJalon
        });
      });
    });

    return ganttTasks;
  };

  const handleTaskClick = (task: Task) => {
    if (isDragging) return;
    
    if (!readOnly && onEditTask) {
      const originalTask = tasks.find(t => t.id === task.id);
      if (originalTask) {
        onEditTask(originalTask);
      }
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
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

  const handleTaskChange = (task: Task) => {
    if (readOnly) return;
    
    const originalTask = tasks.find(t => t.id === task.id);
    if (originalTask) {
      updateTaskDates(task.id, task.start, task.end);
    }
    
    setTimeout(() => {
      setIsDragging(false);
    }, 500);
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

  const handleShowTasksChange = (value: boolean) => {
    setShowTasks(value);
  };

  const TaskListHeader = () => {
    return (
      <div className="grid grid-cols-3 font-semibold bg-gray-100 border-b border-gray-200">
        <div className="p-2 truncate">Titre</div>
        <div className="p-2 truncate">Début</div>
        <div className="p-2 truncate">Fin</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <GanttViewButtons
          mode={viewMode === ViewMode.Week ? 'week' : viewMode === ViewMode.Month ? 'month' : 'year'}
          showTasks={showTasks}
          onViewModeChange={handleViewModeChange}
          onShowTasksChange={handleShowTasksChange}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <GanttLegend showTasks={true} />

        <div ref={ganttRef} className="h-[600px] w-full overflow-x-auto">
          <Gantt
            tasks={generateGanttTasks()}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onProgressChange={(task) => console.log('Progress changed', task)}
            onClick={() => {}}
            onDoubleClick={handleTaskClick}
            onDelete={(task) => console.log('Task deleted', task)}
            // Utilisons height au lieu de ganttHeight qui n'est plus supporté
            height={600}
            rowHeight={50}
            barCornerRadius={14}
            handleWidth={8}
            TaskListHeader={showTasks ? TaskListHeader : undefined}
            TaskListTable={showTasks ? undefined : undefined}
            TooltipContent={({ task }) => (
              <div className="p-2 bg-white shadow rounded border">
                <div><strong>{task.name}</strong></div>
                <div>Début: {format(task.start, 'dd/MM/yyyy')}</div>
                <div>Fin: {format(task.end, 'dd/MM/yyyy')}</div>
                <div>Statut: {task.progress === 100 ? 'Terminé' : task.progress > 0 ? 'En cours' : 'À faire'}</div>
              </div>
            )}
            locale="fr"
            arrowColor="#777"
            todayColor="rgba(252, 220, 0, 0.4)"
            barProgressColor="#a3a3a3"
            projectProgressColor="#7db59a"
            projectProgressSelectedColor="#59a985"
            fontFamily="Arial, sans-serif"
          />
        </div>
      </div>
    </div>
  );
};
