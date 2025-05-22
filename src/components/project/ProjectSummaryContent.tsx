
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { StatusIcon } from "./StatusIcon";
import { ProjectMetrics } from "./ProjectMetrics";
import { TaskSummary } from "@/components/TaskSummary";
import { RiskSummary } from "@/components/RiskSummary";
import { LastReview } from "@/components/LastReview";
import ProjectSummaryActions from "./ProjectSummaryActions";

interface ProjectSummaryContentProps {
  project: any;
  lastReview: any;
  risks: any[];
  tasks: any[];
  isProjectManager?: boolean;
  isAdmin?: boolean;
  canEdit?: boolean;
}

export const ProjectSummaryContent = ({
  project,
  lastReview,
  risks,
  tasks,
  isProjectManager,
  isAdmin,
  canEdit,
}: ProjectSummaryContentProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0 space-x-2">
              <StatusIcon status={project.status as ProjectStatus} size={20} />
              <h1 className="text-2xl font-bold">{project.title}</h1>
            </div>
            
            <ProjectSummaryActions 
              project={project}
              risks={risks}
              tasks={tasks}
            />
          </div>

          <p className="text-gray-600 mb-6">{project.description}</p>

          <ProjectMetrics 
            project={project}
            lastReviewProgress={lastReview?.progress as ProgressStatus}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LastReview review={lastReview} projectId={project.id} />

        <div className="space-y-6">
          <TaskSummary tasks={tasks} projectId={project.id} />
          <RiskSummary risks={risks} projectId={project.id} />
        </div>
      </div>
    </div>
  );
};
