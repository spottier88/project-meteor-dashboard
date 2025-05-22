
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { StatusIcon } from "./StatusIcon";
import { ProjectMetrics } from "./ProjectMetrics";
import { LastReview } from "@/components/LastReview";
import ProjectSummaryActions from "./ProjectSummaryActions";
import { TeamManagement } from "./TeamManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskList } from "@/components/RiskList";
import { TaskList } from "@/components/TaskList";
import { InnovationRadarChart } from "@/components/innovation/InnovationRadarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Données d'innovation du projet (reconstituées depuis les données du projet)
  const innovationData = {
    novateur: project.innovation_score?.novateur || 0,
    usager: project.innovation_score?.usager || 0,
    ouverture: project.innovation_score?.ouverture || 0,
    agilite: project.innovation_score?.agilite || 0,
    impact: project.innovation_score?.impact || 0,
  };

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

        {/* Carte du diagramme d'innovation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Innovation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InnovationRadarChart data={innovationData} size={220} />
          </CardContent>
        </Card>
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
