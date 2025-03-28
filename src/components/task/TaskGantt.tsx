
import { useEffect, useRef, useState } from 'react';
import Timeline from 'react-gantt-timeline';
import { GanttViewButtons } from '@/components/gantt/GanttViewButtons';
import { GanttLegend } from '@/components/gantt/GanttLegend';
import { GanttTask, GanttLink } from '@/components/gantt/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/utils/formatUserName';

interface Task {
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
  tasks: Task[];
  projectId: string;
  readOnly?: boolean;
  onEditTask?: (task: Task) => void;
}

export const TaskGantt = ({ tasks, projectId, readOnly = false, onEditTask }: TaskGanttProps) => {
  const [mode, setMode] = useState<'week' | 'month' | 'year'>('month');
  const [dayWidth, setDayWidth] = useState(30);
  const [showTasks, setShowTasks] = useState(true);
  const ganttRef = useRef<HTMLDivElement>(null);

  // Récupérer les profils des membres du projet
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
      
      // Récupérer aussi le chef de projet
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
          // Vérifier que le chef de projet n'est pas déjà dans la liste
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

  // Extraire les profils pour les passer à formatUserName
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

  // Création des tâches avec organisation hiérarchique pour Gantt
  const generateTasks = (): GanttTask[] => {
    const allTasks: GanttTask[] = [];
    
    // Organiser les tâches par niveau hiérarchique
    const parentTasks = tasks
      .filter(task => !task.parent_task_id)
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
    
    // Créer les tâches Gantt pour les tâches parentes
    parentTasks.forEach(task => {
      const taskId = task.id;
      const taskStartDate = task.start_date ? new Date(task.start_date) : new Date();
      const taskEndDate = task.due_date ? new Date(task.due_date) : new Date();
      
      allTasks.push({
        id: taskId,
        start: taskStartDate,
        end: taskEndDate,
        name: `${task.title} ${task.assignee ? `- ${formatUserName(task.assignee, profiles)}` : ''}`,
        color: getColorForStatus(task.status),
        type: 'task',
        project_id: task.project_id,
        // Nous ne définissons pas le status ici car il n'est pas compatible
      });
      
      // Trouver et ajouter les sous-tâches pour cette tâche
      const childTasks = tasks
        .filter(childTask => childTask.parent_task_id === task.id)
        .sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        });
      
      childTasks.forEach(childTask => {
        const childTaskId = childTask.id;
        const childStartDate = childTask.start_date ? new Date(childTask.start_date) : taskStartDate;
        const childEndDate = childTask.due_date ? new Date(childTask.due_date) : taskEndDate;
        
        allTasks.push({
          id: childTaskId,
          start: childStartDate,
          end: childEndDate,
          name: `  └ ${childTask.title} ${childTask.assignee ? `- ${formatUserName(childTask.assignee, profiles)}` : ''}`,
          color: getColorForStatus(childTask.status),
          type: 'subtask',
          project_id: childTask.project_id,
          parent_id: taskId,
          parent_task_id: task.id,
          // Nous ne définissons pas le status ici car il n'est pas compatible
        });
      });
    });

    return allTasks;
  };

  // Création des liens entre tâches parentes et enfants
  const generateLinks = (tasks: GanttTask[]): GanttLink[] => {
    const links: GanttLink[] = [];
    
    // Parcourir toutes les tâches pour créer les liens
    tasks.forEach(task => {
      // Créer des liens entre tâches et sous-tâches
      if (task.type === 'subtask' && task.parent_id) {
        links.push({
          id: `link-task-${task.id}`,
          source: task.parent_id,
          target: task.id,
          type: 'finish_to_start'
        });
      }
    });
    
    return links;
  };

  const ganttTasks = generateTasks();
  const links = generateLinks(ganttTasks);

  const setViewMode = (newMode: 'week' | 'month' | 'year') => {
    setMode(newMode);
    switch (newMode) {
      case 'week':
        setDayWidth(60);
        break;
      case 'month':
        setDayWidth(30);
        break;
      case 'year':
        setDayWidth(15);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <GanttViewButtons
          mode={mode}
          showTasks={showTasks}
          onViewModeChange={setViewMode}
          onShowTasksChange={setShowTasks}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <GanttLegend showTasks={true} />

        <div ref={ganttRef} className="h-[600px] w-full overflow-x-auto">
          <Timeline 
            data={ganttTasks}
            links={links}
            mode={mode}
            onSelectItem={(item) => {
              if (!readOnly && onEditTask) {
                // Trouver la tâche correspondante dans la liste des tâches
                const task = tasks.find(t => t.id === item.id);
                if (task) {
                  onEditTask(task);
                }
              }
            }}
            itemHeight={50}
            rowHeight={45}
            taskHeight={40}
            nonWorkingDays={[6, 0]}
            dayWidth={dayWidth}
            config={{
              header: {
                top: {
                  style: {backgroundColor: "#333333"}
                },
                middle: {
                  style: {backgroundColor: "chocolate"},
                  selectedStyle: {backgroundColor: "#b13525"}
                },
                bottom: {
                  style: {background: "grey", fontSize: 9},
                  selectedStyle: {backgroundColor: "#b13525", fontWeight: 'bold'}
                }
              },
              taskList: {
                title: {
                  label: "Tâches",
                  style: {
                    backgroundColor: '#333333',
                    borderBottom: 'solid 1px silver',
                    color: 'white',
                    textAlign: 'left',
                    padding: '0 10px'
                  }
                },
                task: {
                  style: {
                    textAlign: 'left',
                    padding: '0 10px'
                  }
                },
                verticalSeparator: {
                  style: {backgroundColor: '#333333'},
                  grip: {
                    style: {backgroundColor: '#cfcfcd'}
                  }
                }
              },
              dataViewPort: {
                rows: {
                  style: {backgroundColor: "#fbf9f9", borderBottom: 'solid 0.5px #cfcfcd'}
                },
                task: {
                  showLabel: true,
                  style: {
                    position: 'absolute',
                    borderRadius: 14,
                    color: '#333333',
                    textAlign: 'left',
                    backgroundColor: 'grey'
                  },
                  selectedStyle: {
                    position: 'absolute',
                    borderRadius: 14,
                    border: '1px solid #1976d2',
                    color: '#333333',
                    textAlign: 'left',
                    backgroundColor: 'rgba(25, 118, 210, 0.3)'
                  }
                }
              },
              links: {
                color: '#787878',
                selectedColor: '#ff00fa',
                thickness: 2
              },
              handleWidth: 0,
              gridColor: '#eee',
              todayColor: 'rgba(252, 220, 0, 0.4)',
              viewMode: mode,
              locale: 'fr-FR',
              dateFormat: {
                month: {
                  short: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
                  long: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
                },
                week: {
                  letter: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
                  short: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
                  long: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
