
import React from 'react';
import Timeline from 'react-gantt-timeline';
import { GanttViewButtons } from './GanttViewButtons';
import { GanttExportButtons } from './GanttExportButtons';
import { GanttLegend } from './GanttLegend';
import { GanttTask, GanttLink, ProjectGanttViewProps } from './types';

export const ProjectGanttView = ({ projects }: ProjectGanttViewProps) => {
  const [mode, setMode] = React.useState<'week' | 'month' | 'year'>('month');
  const [dayWidth, setDayWidth] = React.useState(30);
  const [showTasks, setShowTasks] = React.useState(false);
  const ganttRef = React.useRef<HTMLDivElement>(null);

  const getColorForStatus = (status: string, isProject: boolean = false) => {
    if (isProject) {
      return '#9b87f5';
    }
    
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

  // Création des tâches et tri par date de début
  const generateTasks = (): GanttTask[] => {
    const allTasks: GanttTask[] = [];
    
    projects.forEach((project) => {
      const projectTask: GanttTask = {
        id: project.id,
        start: project.start_date ? new Date(project.start_date) : new Date(),
        end: project.end_date ? new Date(project.end_date) : new Date(),
        name: project.title,
        color: getColorForStatus(project.lifecycle_status, true),
        type: 'project',
        completion: project.completion
      };
      
      allTasks.push(projectTask);

      if (showTasks && project.tasks && project.tasks.length > 0) {
        // Organiser les tâches par niveau hiérarchique
        const parentTasks = project.tasks.filter(task => !task.parent_task_id);
        const childTasks = project.tasks.filter(task => task.parent_task_id);
        
        // Créer les tâches Gantt pour les tâches parentes
        parentTasks.forEach(task => {
          allTasks.push({
            id: `${project.id}-${task.id}`,
            start: task.start_date ? new Date(task.start_date) : new Date(),
            end: task.due_date ? new Date(task.due_date) : new Date(),
            name: task.title,
            color: getColorForStatus(task.status),
            type: 'task',
            project_id: project.id,
            parent_task_id: undefined
          });
        });

        // Créer les tâches Gantt pour les sous-tâches
        childTasks.forEach(task => {
          allTasks.push({
            id: `${project.id}-${task.id}`,
            start: task.start_date ? new Date(task.start_date) : new Date(),
            end: task.due_date ? new Date(task.due_date) : new Date(),
            name: `└ ${task.title}`,  // Préfixe pour indiquer que c'est une sous-tâche
            color: getColorForStatus(task.status),
            type: 'subtask',
            project_id: project.id,
            parent_task_id: task.parent_task_id
          });
        });
      }
    });

    // Trier par date de début
    return allTasks.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  // Création des liens entre tâches parentes et enfants
  const generateLinks = (tasks: GanttTask[]): GanttLink[] => {
    const links: GanttLink[] = [];
    
    if (!showTasks) return links;
    
    // Créer des liens entre les tâches parentes et leurs sous-tâches
    tasks.forEach(task => {
      if (task.type === 'subtask' && task.parent_task_id) {
        const parentTaskId = `${task.project_id}-${task.parent_task_id}`;
        
        // Vérifier que la tâche parente existe dans notre liste
        const parentExists = tasks.some(t => t.id === parentTaskId);
        
        if (parentExists) {
          links.push({
            id: `link-${task.id}-${parentTaskId}`,
            source: parentTaskId,
            target: task.id,
            type: 'finish_to_start'
          });
        }
      }
    });
    
    return links;
  };

  const tasks = generateTasks();
  const links = generateLinks(tasks);

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
        <GanttExportButtons tasks={tasks} ganttRef={ganttRef} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <GanttLegend showTasks={showTasks} />

        <div ref={ganttRef} className="h-[600px] w-full">
          <Timeline 
            data={tasks}
            links={links}
            mode={mode}
            onSelectItem={(item) => console.log("Item clicked:", item)}
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
                  label: "Projets",
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
                  showLabel: false,
                  style: {
                    position: 'absolute',
                    borderRadius: 14,
                    color: 'white',
                    textAlign: 'left',
                    backgroundColor: 'grey'
                  },
                  selectedStyle: {}
                }
              },
              links: {
                color: '#787878',
                selectedColor: '#ff00fa'
              },
              handleWidth: 0,
              showProjectLabel: true,
              projectBackgroundColor: '#9b87f5',
              projectBackgroundSelectedColor: '#8b77e5',
              projectSelectedColor: '#7a66d4',
              projectCompletionColor: '#4CAF50',
              projectProgressColor: '#2196F3',
              projectDeadlineColor: '#f44336',
              projectTextColor: '#ffffff',
              projectTextStyle: { fontWeight: 'bold' },  // Mettre en gras pour les projets
              taskTextColor: '#333333',
              taskSelectedColor: '#1a73e8',
              taskProgressColor: '#2196F3',
              taskCompletionColor: '#4CAF50',
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
