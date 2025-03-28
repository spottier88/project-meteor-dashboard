
import { useEffect, useRef, useState } from 'react';
import { Gantt, Task, ViewMode, DisplayOption, StylingOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { GanttViewButtons } from '@/components/gantt/GanttViewButtons';
import { GanttLegend } from '@/components/gantt/GanttLegend';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/utils/formatUserName';

interface TaskInterface {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assignee?: string;
  due_date?: string;
  start_date?: string;
  project_id: string;
  parent_task_id?: string | null;
}

interface TaskGanttProps {
  tasks: TaskInterface[];
  projectId: string;
  readOnly?: boolean;
  onEditTask?: (task: TaskInterface) => void;
}

export const TaskGantt = ({ tasks, projectId, readOnly = false, onEditTask }: TaskGanttProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showTasks, setShowTasks] = useState(true);
  const ganttRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setViewMode(prev => prev);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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

  const generateGanttTasks = (): Task[] => {
    const ganttTasks: Task[] = [];
    
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
        progress: task.status === 'done' ? 100 : (task.status === 'in_progress' ? 50 : 0),
        type: isJalon ? 'milestone' : 'task',
        styles: { 
          backgroundColor: getColorForStatus(task.status),
          progressColor: '#a3a3a3'
        },
        isDisabled: readOnly
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
          progress: childTask.status === 'done' ? 100 : (childTask.status === 'in_progress' ? 50 : 0),
          type: isChildJalon ? 'milestone' : 'task',
          project: taskId,
          dependencies: [taskId],
          styles: { 
            backgroundColor: getColorForStatus(childTask.status),
            progressColor: '#a3a3a3'
          },
          isDisabled: readOnly
        });
      });
    });

    return ganttTasks;
  };

  const handleTaskClick = (task: Task) => {
    if (!readOnly && onEditTask) {
      const originalTask = tasks.find(t => t.id === task.id);
      if (originalTask) {
        onEditTask(originalTask);
      }
    }
  };

  // Removed getGanttDisplayOptions and getGanttStylingOptions functions that were causing type errors
  // We'll apply the permitted properties directly to the Gantt component instead

  const handleViewModeChange = (mode: 'week' | 'month' | 'year') => {
    switch (mode) {
      case 'week':
        setViewMode(ViewMode.Week);
        break;
      case 'month':
        setViewMode(ViewMode.Month);
        break;
      case 'year':
        setViewMode(ViewMode.Year);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <GanttViewButtons
          mode={viewMode === ViewMode.Week ? 'week' : (viewMode === ViewMode.Month ? 'month' : 'year')}
          showTasks={showTasks}
          onViewModeChange={handleViewModeChange}
          onShowTasksChange={setShowTasks}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <GanttLegend showTasks={true} />

        <div ref={ganttRef} className="h-[600px] w-full overflow-x-auto">
          {showTasks ? (
            <Gantt
              tasks={generateGanttTasks()}
              viewMode={viewMode}
              onDateChange={(task) => console.log('Date changed', task)}
              onProgressChange={(task) => console.log('Progress changed', task)}
              onClick={handleTaskClick}
              onDoubleClick={handleTaskClick}
              onDelete={(task) => console.log('Task deleted', task)}
              onSelect={(task) => console.log('Task selected', task)}
              listCellWidth=""
              ganttHeight={0}
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Activer l'affichage de la liste des tâches pour voir le diagramme de Gantt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
