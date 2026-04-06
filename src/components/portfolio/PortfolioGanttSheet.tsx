/**
 * @file PortfolioGanttSheet.tsx
 * @description Sheet affichant la vue Gantt des projets d'un portefeuille.
 * Utilise SVAR React Gantt via le composant TaskGantt.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TaskGantt } from "@/components/task/TaskGantt";

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
  projectIds,
}: PortfolioGanttSheetProps) => {
  // Récupération des données des projets et de leurs taux d'avancement
  const { data: projectsData } = useQuery({
    queryKey: ["portfolioGantt", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      // Récupérer les projets et leurs dernières revues en parallèle
      const [projectsRes, reviewsRes] = await Promise.all([
        supabase
          .from("projects")
          .select(`id, title, start_date, end_date, lifecycle_status`)
          .in("id", projectIds),
        supabase
          .from("latest_reviews")
          .select("project_id, completion")
          .in("project_id", projectIds),
      ]);

      if (projectsRes.error) throw projectsRes.error;

      // Construire une map project_id → completion
      const completionMap = new Map<string, number>();
      if (reviewsRes.data) {
        for (const r of reviewsRes.data) {
          if (r.project_id && r.completion !== null) {
            completionMap.set(r.project_id, r.completion);
          }
        }
      }

      return (projectsRes.data || []).map((p) => ({ ...p, completion: completionMap.get(p.id) ?? null }));
    },
    enabled: isOpen && projectIds.length > 0,
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
    completion: project.completion,
  })) || [];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] w-full flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Vue Gantt des projets du portefeuille</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex-1 overflow-y-auto min-h-0">
          {allTasks.length > 0 ? (
            <TaskGantt
              tasks={allTasks}
              projectId={projectIds[0]}
              onEdit={undefined}
              onUpdate={undefined}
              exportContext="portfolio"
              isReadOnly={true}
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
