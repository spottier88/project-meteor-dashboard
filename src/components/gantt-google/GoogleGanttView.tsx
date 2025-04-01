
import { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { GanttViewButtons } from '@/components/gantt/GanttViewButtons';
import { GanttLegend } from '@/components/gantt/GanttLegend';
import { convertTasksToGoogleChartFormat, getColorForStatus } from './TaskAdapter';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarRange, CalendarDays, CalendarClock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  // Configuration de la localisation française pour le graphique
  const frenchLanguage = {
    language: 'fr',
    months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    shortDays: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
    shortMonths: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  };

  // Options pour le diagramme Timeline
  const options = {
    height: 600,
    timeline: {
      showRowLabels: true,
      showBarLabels: true,
      groupByRowLabel: false,
      colorByRowLabel: false
    },
    hAxis: {
      format: viewMode === 'day' ? 'HH:mm' : viewMode === 'week' ? 'dd/MM' : 'MMM yyyy',
    },
    tooltip: { isHtml: true }, // Activer les tooltips HTML
    colors: tasks.map(task => getColorForStatus(task.status)),
    language: 'fr',
    calendar: frenchLanguage
  };

  // Gérer le clic sur une tâche
  const handleChartClick = (chartWrapper: any) => {
    if (readOnly) return;
    
    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    
    if (selection && selection.length > 0) {
      const row = selection[0].row;
      if (row !== null && row >= 0) {
        // Trouver la tâche correspondante en utilisant le titre comme identifiant
        const taskTitle = formattedTasks[row + 1][0];
        const originalTask = tasks.find(t => t.title === taskTitle);
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

  const handleScaleChange = (value: string) => {
    if (value) setViewMode(value as 'day' | 'week' | 'month');
  };

  useEffect(() => {
    console.log("Tasks disponibles pour le Gantt:", tasks?.length || 0);
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <GanttViewButtons
            mode={viewMode === 'day' ? 'week' : viewMode === 'week' ? 'month' : 'year'}
            showTasks={showTasks}
            onViewModeChange={handleViewModeChange}
            onShowTasksChange={handleShowTasksChange}
          />
          
          <TooltipProvider>
            <div className="border rounded-md p-1">
              <ToggleGroup type="single" value={viewMode} onValueChange={handleScaleChange}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="day" aria-label="Vue journalière">
                      <CalendarClock className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Semaine</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="week" aria-label="Vue hebdomadaire">
                      <CalendarDays className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Mois</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="month" aria-label="Vue mensuelle">
                      <CalendarRange className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Année</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <GanttLegend showTasks={true} />

        <div className="h-[600px] w-full overflow-x-auto">
          {formattedTasks.length > 1 ? (
            <Chart
              chartType="Timeline"
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
              chartLanguage="fr"
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
