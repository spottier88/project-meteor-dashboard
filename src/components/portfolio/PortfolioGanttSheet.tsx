/**
 * @file PortfolioGanttSheet.tsx
 * @description Sheet affichant la vue Gantt des projets d'un portefeuille.
 * Permet de visualiser le planning des projets et de leurs tâches.
 */

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TaskGantt } from "@/components/task/TaskGantt";
import { Task } from "gantt-task-react";

interface PortfolioGanttSheetProps {
  /** Indique si le sheet est ouvert */
  isOpen: boolean;
  /** Callback de fermeture */
  onClose: () => void;
  /** Liste des IDs des projets à afficher */
  projectIds: string[];
}

/**
 * Composant affichant une vue Gantt des projets d'un portefeuille
 */
export const PortfolioGanttSheet = ({ 
  isOpen, 
  onClose, 
  projectIds 
}: PortfolioGanttSheetProps) => {
  // État pour gérer les projets repliés dans le Gantt
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  // Récupération des données des projets et de leurs tâches
  const { data: projectsData } = useQuery({
    queryKey: ["portfolioGantt", projectIds],
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
    enabled: isOpen && projectIds.length > 0,
  });

  // Transformer les données des projets et tâches en format plat pour le Gantt
  const allTasks = projectsData?.reduce((acc: any[], project) => {
    // Ajouter le projet comme une tâche parent
    acc.push({
      id: project.id,
      title: project.title,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.lifecycle_status,
      project_id: project.id,
      parent_task_id: null,
      hideChildren: collapsedProjects.has(project.id),
      type: 'project'
    });

    // Ajouter les tâches du projet
    if (project.tasks) {
      project.tasks.forEach((task: any) => {
        acc.push({
          ...task,
          project_id: project.id,
          parent_task_id: task.parent_task_id || project.id,
        });
      });
    }

    return acc;
  }, []) || [];

  /**
   * Gère le clic sur l'expandeur pour replier/déplier un projet
   */
  const handleExpanderClick = (task: Task) => {
    if (task.type === 'project') {
      setCollapsedProjects(prev => {
        const newSet = new Set(prev);
        if (newSet.has(task.id)) {
          newSet.delete(task.id);
        } else {
          newSet.add(task.id);
        }
        return newSet;
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] w-full">
        <SheetHeader>
          <SheetTitle>Vue Gantt des projets du portefeuille</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {allTasks.length > 0 ? (
            <TaskGantt
              tasks={allTasks}
              projectId={projectIds[0]}
              onEdit={undefined}
              onUpdate={undefined}
              onExpanderClick={handleExpanderClick}
            />
          ) : (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
