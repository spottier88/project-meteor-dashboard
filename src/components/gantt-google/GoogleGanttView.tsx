
import { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { GanttViewButtons } from '@/components/gantt/GanttViewButtons';
import { GanttLegend } from '@/components/gantt/GanttLegend';
import { convertTasksToGoogleChartFormat } from './TaskAdapter';
import { logger } from '@/utils/logger';

interface GoogleGanttViewProps {
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

export const GoogleGanttView = ({ tasks, projectId, readOnly = false, onEditTask }: GoogleGanttViewProps) => {
  const [showTasks, setShowTasks] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const { toast } = useToast();

  // Récupérer les membres du projet pour afficher les noms des personnes assignées
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

  // Convertir les tâches au format Google Charts
  const formattedTasks = convertTasksToGoogleChartFormat(tasks, profiles);

  // Option pour le diagramme Gantt
  const options = {
    height: 600,
    gantt: {
      trackHeight: 30,
      barHeight: 20,
      labelStyle: {
        fontName: 'sans-serif',
        fontSize: 12,
      },
      palette: [
        {
          color: '#F2FCE2', // Todo
          dark: '#E5F0D5',
          light: '#F9FDEE',
        },
        {
          color: '#D3E4FD', // In progress
          dark: '#C6D7F0',
          light: '#E9F3FE',
        },
        {
          color: '#E2E8F0', // Done
          dark: '#D5DBE3',
          light: '#F1F4F8',
        },
      ],
      // Définir l'échelle de temps en fonction du mode de vue
      innerGridHorizLine: {
        stroke: '#efefef',
      },
      innerGridTrack: {fill: '#f9f9f9'},
      innerGridDarkTrack: {fill: '#f1f1f1'}
    },
  };

  // Gérer le clic sur une tâche
  const handleChartClick = (chartWrapper: any) => {
    if (readOnly) return;
    
    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    
    if (selection && selection.length > 0) {
      const row = selection[0].row;
      if (row !== null && row >= 0) {
        const taskId = formattedTasks[row + 1][0] as string; // +1 car la première ligne est l'en-tête
        console.log("Clic sur la tâche:", taskId);
        
        const originalTask = tasks.find(t => t.id === taskId);
        if (originalTask && onEditTask) {
          onEditTask(originalTask);
        }
      }
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

  useEffect(() => {
    console.log("Tasks disponibles pour le Gantt:", tasks?.length || 0);
  }, [tasks]);

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

        <div className="h-[600px] w-full overflow-x-auto">
          {formattedTasks.length > 1 ? (
            <Chart
              chartType="Gantt"
              width="100%"
              height="100%"
              data={formattedTasks}
              options={options}
              chartEvents={[
                {
                  eventName: 'select',
                  callback: handleChartClick,
                },
              ]}
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
