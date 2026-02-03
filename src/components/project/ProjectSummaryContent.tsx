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
import { ProjectPortfoliosBadges } from "./ProjectPortfoliosBadges";
import { PortfolioReadOnlyBadge } from "./PortfolioReadOnlyBadge";
import { ProjectClosedBadge } from "./ProjectClosedBadge";
import { ClosurePendingBadge } from "./ClosurePendingBadge";
import { ReactivateProjectButton } from "./ReactivateProjectButton";
import { CompleteEvaluationButton } from "./CompleteEvaluationButton";
import { ProjectNotesList } from "@/components/notes/ProjectNotesList";
import { ProjectEvaluationTab } from "./ProjectEvaluationTab";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, ExternalLink, ClipboardCheck } from "lucide-react";
interface ProjectSummaryContentProps {
  project: any;
  lastReview: any;
  previousReview?: { weather: "sunny" | "cloudy" | "stormy" } | null;
  risks: any[];
  tasks: any[];
  innovationScores?: {
    novateur: number;
    usager: number;
    ouverture: number;
    agilite: number;
    impact: number;
  };
  onEditProject?: () => void;
  onCreateReview?: () => void;
  onClosureComplete?: () => void;
  permissions: {
    canEdit: boolean;
    isProjectManager: boolean;
    isAdmin: boolean;
    canManageTeam: boolean;
    canManageRisks: boolean;
    isProjectClosed?: boolean;
    hasPendingEvaluation?: boolean;
    canReactivateProject?: boolean;
    canCompleteEvaluation?: boolean;
    isReadOnlyViaPortfolio?: boolean;
    portfolioAccessInfo?: {
      portfolioId: string;
      portfolioName: string;
      role: 'owner' | 'manager' | 'viewer';
    } | null;
  };
  teamManagement?: {
    project: any;
    members: any[];
    handleDelete: (id: string, email?: string) => void;
    handlePromoteToSecondaryManager: (id: string, roles: string[], isAdmin: boolean) => void;
    handleDemoteToMember: (id: string) => void;
  };
}

export const ProjectSummaryContent = ({
  project,
  lastReview,
  previousReview,
  risks,
  tasks,
  innovationScores,
  onEditProject,
  onCreateReview,
  onClosureComplete,
  permissions,
  teamManagement,
}: ProjectSummaryContentProps) => {
  const queryClient = useQueryClient();
  const projectId = project.id;

  // Récupération du profil du chef de projet pour afficher son nom
  const { data: projectManagerProfile } = useQuery({
    queryKey: ["projectManagerProfile", project.project_manager],
    queryFn: async () => {
      if (!project.project_manager) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("email", project.project_manager)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!project.project_manager,
  });

  // Fonction helper pour afficher le nom du chef de projet
  const getProjectManagerDisplay = () => {
    if (!project.project_manager) return "-";
    if (projectManagerProfile?.first_name && projectManagerProfile?.last_name) {
      return `${projectManagerProfile.first_name} ${projectManagerProfile.last_name}`;
    }
    return project.project_manager;
  };

  // Utiliser les scores d'innovation passés en prop avec des valeurs par défaut
  const innovationData = innovationScores || {
    novateur: 0,
    usager: 0,
    ouverture: 0,
    agilite: 0,
    impact: 0,
  };

  // Handler pour rafraîchir les données après réactivation
  const handleProjectReactivated = () => {
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projectAccess", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
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
                {/* Badge projet clôturé (vert) - seulement si pas d'évaluation en attente */}
                {permissions.isProjectClosed && !permissions.hasPendingEvaluation && (
                  <ProjectClosedBadge />
                )}
                {/* Badge évaluation en attente (orange) - quand clôturé mais évaluation pas faite */}
                {permissions.hasPendingEvaluation && (
                  <ClosurePendingBadge />
                )}
                {/* Afficher le badge lecture seule si applicable (et pas déjà clôturé) */}
                {permissions.isReadOnlyViaPortfolio && !permissions.isProjectClosed && (
                  <PortfolioReadOnlyBadge 
                    portfolioName={permissions.portfolioAccessInfo?.portfolioName} 
                  />
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Bouton de réactivation pour admin/chef de projet si projet clôturé */}
                {/* Bouton pour compléter l'évaluation en attente */}
                {permissions.canCompleteEvaluation && (
                  <CompleteEvaluationButton 
                    projectId={projectId}
                    projectTitle={project.title}
                    onComplete={onClosureComplete}
                  />
                )}
                {/* Bouton de réactivation pour admin/chef de projet si projet clôturé */}
                {permissions.canReactivateProject && (
                  <ReactivateProjectButton 
                    projectId={projectId}
                    onReactivated={handleProjectReactivated}
                  />
                )}
                {/* Masquer les actions si en mode lecture seule via portefeuille OU projet clôturé */}
                {!permissions.isReadOnlyViaPortfolio && !permissions.isProjectClosed && (
                  <ProjectSummaryActions 
                    project={project}
                    risks={risks}
                    tasks={tasks}
                    onEditProject={onEditProject}
                    onCreateReview={onCreateReview}
                    onClosureComplete={onClosureComplete}
                  />
                )}
              </div>
            </div>
            <p className="text-gray-600">{project.description}</p>
            {/* Badges des portefeuilles associés */}
            <ProjectPortfoliosBadges projectId={projectId} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <span className="text-sm text-muted-foreground">Chef de projet</span>
              <p className="font-medium">{getProjectManagerDisplay()}</p>
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
            {/* Lien vers l'équipe Microsoft Teams */}
            {project.teams_url && (
              <div>
                <span className="text-sm text-muted-foreground">Équipe Teams / Espace Sharepoint</span>
                <a 
                  href={project.teams_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <Users className="h-4 w-4" />
                  Accéder à l'équipe
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
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
        <LastReview review={lastReview} previousReview={previousReview} />

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

      {/* Calculer les permissions effectives en tenant compte du projet clôturé */}
      {(() => {
        const effectiveCanEdit = permissions.isProjectClosed ? false : permissions.canEdit;
        const effectiveCanManageTeam = permissions.isProjectClosed ? false : permissions.canManageTeam;
        const effectiveCanManageRisks = permissions.isProjectClosed ? false : permissions.canManageRisks;
        
        return (
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className={`grid w-full max-w-lg ${permissions.isProjectClosed ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="risks">Risques</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="team">Équipe</TabsTrigger>
              {permissions.isProjectClosed && (
                <TabsTrigger value="evaluation" className="flex items-center gap-1">
                  <ClipboardCheck className="h-3 w-3" />
                  Bilan
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="tasks">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                <TaskList 
                  projectId={projectId}
                  canEdit={effectiveCanEdit}
                  isProjectManager={permissions.isProjectManager}
                  isAdmin={permissions.isAdmin}
                  isProjectClosed={permissions.isProjectClosed}
                  preloadedTasks={tasks}
                />
              </div>
            </TabsContent>
            <TabsContent value="risks">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                <RiskList 
                  projectId={projectId}
                  projectTitle={project.title}
                  canEdit={effectiveCanEdit}
                  isProjectManager={permissions.isProjectManager}
                  isAdmin={permissions.isAdmin}
                  isProjectClosed={permissions.isProjectClosed}
                  preloadedRisks={risks}
                />
              </div>
            </TabsContent>
            <TabsContent value="notes">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                <ProjectNotesList
                  projectId={projectId}
                  canEdit={effectiveCanEdit}
                  isAdmin={permissions.isAdmin}
                  isProjectClosed={permissions.isProjectClosed}
                />
              </div>
            </TabsContent>
            <TabsContent value="team">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                {teamManagement ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Équipe projet</h2>
                      {effectiveCanManageTeam && (
                        <div className="flex space-x-2">
                          {/* Les boutons d'ajout seront gérés par TeamMembersTable */}
                        </div>
                      )}
                    </div>
                    <TeamManagement
                      projectId={projectId}
                      permissions={{
                        ...permissions,
                        canEdit: effectiveCanEdit,
                        canManageTeam: effectiveCanManageTeam,
                      }}
                      preloadedData={teamManagement}
                    />
                  </div>
                ) : (
                  <TeamManagement
                    projectId={projectId}
                    permissions={{
                      ...permissions,
                      canEdit: effectiveCanEdit,
                      canManageTeam: effectiveCanManageTeam,
                    }}
                  />
                )}
              </div>
            </TabsContent>
            {/* Onglet Bilan - visible uniquement pour les projets clôturés */}
            {permissions.isProjectClosed && (
              <TabsContent value="evaluation">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
                  <ProjectEvaluationTab projectId={projectId} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        );
      })()}
    </div>
  );
};
