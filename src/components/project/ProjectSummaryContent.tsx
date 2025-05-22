
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { StatusIcon } from "./StatusIcon";
import { ProjectMetrics } from "./ProjectMetrics";
import { TaskSummary } from "@/components/TaskSummary";
import { RiskSummary } from "@/components/RiskSummary";
import { LastReview } from "@/components/LastReview";
import ProjectSummaryActions from "./ProjectSummaryActions";
import { TeamManagement } from "./TeamManagement";
import { Tab, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskList } from "@/components/RiskList";
import { TaskList } from "@/components/TaskList";

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
  const projectId = project.id;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0 space-x-2">
              <StatusIcon status={project.status as ProjectStatus} />
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
            progress={lastReview?.progress as ProgressStatus}
            completion={project.completion || 0}
            lastReviewDate={project.last_review_date || null}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LastReview review={lastReview} />

        <div className="space-y-6">
          <TaskSummary projectId={projectId} />
          <RiskSummary projectId={projectId} />
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="risks">Risques</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <TaskList 
              projectId={projectId}
              canEdit={canEdit || false}
              isProjectManager={isProjectManager || false}
              isAdmin={isAdmin || false}
            />
          </div>
        </TabsContent>
        <TabsContent value="risks">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <RiskList 
              projectId={projectId}
              projectTitle={project.title}
              canEdit={canEdit || false}
              isProjectManager={isProjectManager || false}
              isAdmin={isAdmin || false}
            />
          </div>
        </TabsContent>
        <TabsContent value="team">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <TeamManagement
              projectId={projectId}
              canEdit={canEdit || false}
              isProjectManager={isProjectManager || false}
              isAdmin={isAdmin || false}
              canManageTeam={isProjectManager || isAdmin || false}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

