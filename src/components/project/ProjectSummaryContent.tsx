import { Button } from "@/components/ui/button";
import { RiskList } from "@/components/RiskList";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LastReview } from "@/components/LastReview";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { ProjectSummaryActions } from "./ProjectSummaryActions";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { TaskForm } from "@/components/TaskForm";

interface ProjectSummaryContentProps {
  project: any;
  lastReview: any;
  risks: any[];
  tasks: any[];
  canManage: boolean;
}

export const ProjectSummaryContent = ({
  project,
  lastReview,
  risks,
  tasks,
  canManage,
}: ProjectSummaryContentProps) => {
  const user = useUser();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const roles = userRoles?.map(ur => ur.role);
  const isManager = roles?.includes("manager");
  const isAdmin = roles?.includes("admin");
  const isOnlyManager = isManager && project.project_manager !== user?.email && !isAdmin;
  const showActions = !isOnlyManager;

  return (
    <div className="grid gap-6">
      <ProjectSummaryHeader
        title={project.title}
        description={project.description}
        status={project.status}
        progress={project.progress}
        completion={project.completion}
        project_manager={project.project_manager}
        last_review_date={project.last_review_date}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Dernière revue</h2>
          {lastReview && <LastReview review={lastReview} />}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tâches</h2>
          {showActions && (
            <Button onClick={() => setIsTaskFormOpen(true)} size="sm">
              Nouvelle tâche
            </Button>
          )}
        </div>
        <KanbanBoard projectId={project.id} readOnly={!showActions} />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Risques</h2>
        <RiskList projectId={project.id} projectTitle={project.title} readOnly={!showActions} />
      </div>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={() => {
          setIsTaskFormOpen(false);
        }}
        projectId={project.id}
      />
    </div>
  );
};