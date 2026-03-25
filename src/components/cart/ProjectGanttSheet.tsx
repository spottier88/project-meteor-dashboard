/**
 * @file ProjectGanttSheet.tsx
 * @description Sheet affichant la vue Gantt des projets sélectionnés dans le panier.
 * Utilise SVAR React Gantt pour le rendu du diagramme.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TaskGantt } from "@/components/task/TaskGantt";

interface ProjectGanttSheetProps {
  isOpen: boolean;
  onClose: () => void;
  projectIds: string[];
}

export const ProjectGanttSheet = ({ isOpen, onClose, projectIds }: ProjectGanttSheetProps) => {
  const { data: projectsData } = useQuery({
    queryKey: ["projectsGantt", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          start_date,
          end_date,
          lifecycle_status
        `)
        .in("id", projectIds);

      if (projectsError) throw projectsError;
      return projects || [];
    },
    enabled: projectIds.length > 0,
  });

  // Transformer les projets en format plat pour le Gantt (projets uniquement)
  const allTasks = projectsData?.map((project) => ({
    id: project.id,
    title: project.title,
    start_date: project.start_date,
    end_date: project.end_date,
    status: project.lifecycle_status,
    project_id: project.id,
    parent_task_id: null,
    type: 'project' as const,
  })) || [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] w-fullflex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Vue Gantt des projets sélectionnés</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex-1 overflow-y-auto min-h-0">
          {allTasks.length > 0 ? (
            <TaskGantt
              tasks={allTasks}
              projectId={projectIds[0]}
              onEdit={undefined}
              onUpdate={undefined}
            />
          ) : (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
