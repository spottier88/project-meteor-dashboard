import { Button } from "@/components/ui/button";
import { RiskList } from "@/components/RiskList";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LastReview } from "@/components/LastReview";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { TaskForm } from "@/components/TaskForm";
import { canEditProjectItems } from "@/utils/permissions";

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
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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
  const canEdit = canEditProjectItems(
    roles,
    user?.id,
    project.owner_id,
    project.project_manager,
    userProfile?.email
  );

  const handleTaskEdit = (task: any) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setSelectedTask(null);
  };

  const handleTaskSubmit = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks", project.id] });
    handleTaskFormClose();
  };

  const handleRiskSubmit = async () => {
    await queryClient.invalidateQueries({ queryKey: ["risks", project.id] });
  };

  return (
    <div className="grid gap-6">
      <ProjectSummaryHeader
        title={project.title}
        description={project.description}
        project_manager={project.project_manager}
        id={project.id}
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
          {canEdit && (
            <Button onClick={() => setIsTaskFormOpen(true)} size="sm">
              Nouvelle tâche
            </Button>
          )}
        </div>
        <KanbanBoard 
          projectId={project.id} 
          readOnly={!canEdit} 
          onEditTask={handleTaskEdit}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Risques</h2>
        <RiskList 
          projectId={project.id} 
          projectTitle={project.title} 
          readOnly={!canEdit}
          onRiskSubmit={handleRiskSubmit}
        />
      </div>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={handleTaskFormClose}
        onSubmit={handleTaskSubmit}
        projectId={project.id}
        task={selectedTask}
      />
    </div>
  );
};