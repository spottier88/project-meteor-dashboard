
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectGanttView } from "../gantt/ProjectGanttView";

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
            status
          )
        `)
        .in("id", projectIds);

      if (projectsError) throw projectsError;
      return projects || [];
    },
    enabled: projectIds.length > 0,
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] w-full">
        <SheetHeader>
          <SheetTitle>Vue Gantt des projets sélectionnés</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {projectsData ? (
            <ProjectGanttView projects={projectsData} />
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
