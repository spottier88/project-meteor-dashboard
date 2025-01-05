import { Button } from "@/components/ui/button";
import { RiskList } from "@/components/RiskList";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LastReview } from "@/components/LastReview";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { ProjectSummaryActions } from "./ProjectSummaryActions";

interface ProjectSummaryContentProps {
  project: any;
  lastReview: any;
  risks: any[];
  tasks: any[];
  canManage: boolean;
  onAddTask: () => void;
}

export const ProjectSummaryContent = ({
  project,
  lastReview,
  risks,
  tasks,
  canManage,
  onAddTask,
}: ProjectSummaryContentProps) => {
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
          <ProjectSummaryActions canManage={canManage} onAddTask={onAddTask} />
        </div>
        <KanbanBoard projectId={project.id} />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Risques</h2>
        <RiskList projectId={project.id} projectTitle={project.title} />
      </div>
    </div>
  );
};