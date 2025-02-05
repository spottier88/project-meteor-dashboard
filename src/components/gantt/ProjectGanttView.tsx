import React from 'react';
import Timeline from 'react-gantt-timeline';
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';

interface GanttTask {
  id: string;
  start: Date;
  end: Date;
  name: string;
  color: string;
  type: 'project' | 'task';
  project_id?: string;
  status?: ProjectStatus;
  progress?: ProgressStatus;
  lifecycle_status?: ProjectLifecycleStatus;
  completion?: number;
}

interface ProjectGanttViewProps {
  projects: Array<{
    id: string;
    title: string;
    start_date?: string;
    end_date?: string;
    status?: ProjectStatus;
    progress?: ProgressStatus;
    lifecycle_status: ProjectLifecycleStatus;
    completion?: number;
    tasks?: Array<{
      id: string;
      title: string;
      start_date?: string;
      due_date?: string;
      status: "todo" | "in_progress" | "done";
    }>;
  }>;
}

export const ProjectGanttView = ({ projects }: ProjectGanttViewProps) => {
  const [mode, setMode] = React.useState<'week' | 'month' | 'year'>('month');
  const [dayWidth, setDayWidth] = React.useState(30);
  const ganttRef = React.useRef<HTMLDivElement>(null);

  const getColorForStatus = (status: ProjectLifecycleStatus | string, isProject: boolean = false) => {
    if (isProject) {
      return '#9b87f5'; // Violet primaire pour tous les projets
    }
    
    switch (status) {
      case 'todo':
        return '#F2FCE2'; // Vert très clair
      case 'in_progress':
        return '#D3E4FD'; // Bleu clair
      case 'done':
        return '#E2E8F0'; // Gris clair
      default:
        return '#F3F4F6'; // Gris très clair par défaut
    }
  };

  const tasks: GanttTask[] = projects.flatMap((project) => {
    const projectTask: GanttTask = {
      id: project.id,
      start: project.start_date ? new Date(project.start_date) : new Date(),
      end: project.end_date ? new Date(project.end_date) : new Date(),
      name: project.title,
      color: getColorForStatus(project.lifecycle_status, true),
      type: 'project',
      completion: project.completion
    };

    const subTasks: GanttTask[] = (project.tasks || []).map((task) => ({
      id: `${project.id}-${task.id}`,
      start: task.start_date ? new Date(task.start_date) : new Date(),
      end: task.due_date ? new Date(task.due_date) : new Date(),
      name: task.title,
      color: getColorForStatus(task.status),
      type: 'task',
      project_id: project.id
    }));

    return [projectTask, ...subTasks];
  });

  const handleExport = async () => {
    if (ganttRef.current) {
      try {
        const canvas = await html2canvas(ganttRef.current, {
          height: ganttRef.current.scrollHeight,
          windowHeight: ganttRef.current.scrollHeight
        });
        const link = document.createElement('a');
        link.download = 'gantt-export.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
      }
    }
  };

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
        <div className="space-x-2">
          <Button
            variant={mode === 'week' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Semaine
          </Button>
          <Button
            variant={mode === 'month' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mois
          </Button>
          <Button
            variant={mode === 'year' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('year')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Année
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-[#9b87f5] mr-2"></div>
              <span>Projet</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-[#F2FCE2] mr-2"></div>
              <span>À faire</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-[#D3E4FD] mr-2"></div>
              <span>En cours</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-[#E2E8F0] mr-2"></div>
              <span>Terminé</span>
            </div>
          </div>
        </div>

        <div ref={ganttRef} className="h-[600px] w-full">
          <Timeline 
            data={tasks}
            links={[]}
            mode={mode}
            onSelectItem={(item) => console.log("Item clicked:", item)}
            itemHeight={50}
            rowHeight={45}
            taskHeight={40}
            nonWorkingDays={[6, 0]}
            dayWidth={dayWidth}
            config={{
              handleWidth: 0,
              showProjectLabel: true,
              projectBackgroundColor: '#9b87f5',
              projectBackgroundSelectedColor: '#8b77e5',
              projectSelectedColor: '#7a66d4',
              projectCompletionColor: '#4CAF50',
              projectProgressColor: '#2196F3',
              projectDeadlineColor: '#f44336',
              projectTextColor: '#ffffff',
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