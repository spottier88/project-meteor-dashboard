
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
          status,
          progress,
          lifecycle_status,
          tasks (
            id,
            title,
            start_date,
            due_date,
            status,
            parent_task_id
          )
        `)
        .in("id", projectIds);

      if (projectsError) throw projectsError;
      return projects || [];
    },
    enabled: projectIds.length > 0,
  });

  // Transformer les données des projets et tâches en un format plat pour le Gantt
  const allTasks = projectsData?.reduce((acc: any[], project) => {
    // Ajouter le projet comme une tâche parent
    acc.push({
      id: project.id,
      title: project.title,
      start_date: project.start_date,
      due_date: project.end_date,
      status: project.lifecycle_status,
      project_id: project.id,
      parent_task_id: null,
    });

    // Ajouter les tâches du projet
    if (project.tasks) {
      project.tasks.forEach((task: any) => {
        acc.push({
          ...task,
          project_id: project.id,
          parent_task_id: task.parent_task_id || project.id, // Si pas de parent_task_id, lier au projet
        });
      });
    }

    return acc;
  }, []) || [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] w-full">
        <SheetHeader>
          <SheetTitle>Vue Gantt des projets sélectionnés</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {allTasks.length > 0 ? (
            <TaskGantt
              tasks={allTasks}
              projectId={projectIds[0]} // Nécessaire mais non utilisé en mode lecture seule
              onEdit={undefined} // Désactive l'édition
              onUpdate={undefined} // Désactive la mise à jour
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
