
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
  onEditProject?: () => void;
  onCreateReview?: () => void;
  permissions: {
    canEdit: boolean;
    isProjectManager: boolean;
    isAdmin: boolean;
    canManageTeam: boolean;
    canManageRisks: boolean;
  };
}

export const ProjectSummaryContent = ({
  project,
  lastReview,
  risks,
  tasks,
  onEditProject,
  onCreateReview,
  permissions,
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

  // Utilisation de l'avancement provenant de la dernière revue si disponible, sinon utiliser l'avancement du projet
  const completionPercentage = lastReview?.completion ?? project.completion ?? 0;

  return (
    <div className="space-y-6">
      {/* En-tête du projet avec les informations principales */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusIcon status={project.status as ProjectStatus} />
                <h1 className="text-2xl font-bold">{project.title}</h1>
              </div>
              <ProjectSummaryActions 
                project={project}
                risks={risks}
                tasks={tasks}
                onEditProject={onEditProject}
                onCreateReview={onCreateReview}
              />
            </div>
            <p className="text-gray-600">{project.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <span className="text-sm text-muted-foreground">Chef de projet</span>
              <p className="font-medium">{project.project_manager || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Avancement</span>
              <p className="font-medium">{completionPercentage}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Progression</span>
              <p className="font-medium">
                {lastReview?.progress === "better" ? "En amélioration" : 
                 lastReview?.progress === "stable" ? "Stable" : 
                 lastReview?.progress === "worse" ? "En dégradation" : "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Période</span>
              <p className="font-medium">
                {project.start_date && project.end_date ? 
                  `${new Date(project.start_date).toLocaleDateString("fr-FR")} - ${new Date(project.end_date).toLocaleDateString("fr-FR")}` : 
                  "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Dernière revue</span>
              <p className="font-medium">
                {lastReview?.created_at ? 
                  new Date(lastReview.created_at).toLocaleDateString("fr-FR") : 
                  "-"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-1">État d'avancement</p>
            <ProjectMetrics 
              progress={lastReview?.progress as ProgressStatus}
              completion={completionPercentage}
              lastReviewDate={project.last_review_date || null}
            />
          </div>
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
              canEdit={permissions.canEdit}
              isProjectManager={permissions.isProjectManager}
              isAdmin={permissions.isAdmin}
            />
          </div>
        </TabsContent>
        <TabsContent value="risks">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <RiskList 
              projectId={projectId}
              projectTitle={project.title}
              canEdit={permissions.canEdit}
              isProjectManager={permissions.isProjectManager}
              isAdmin={permissions.isAdmin}
            />
          </div>
        </TabsContent>
        <TabsContent value="team">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <TeamManagement
              projectId={projectId}
              permissions={permissions}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
