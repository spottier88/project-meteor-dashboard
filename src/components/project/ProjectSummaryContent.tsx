
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
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectSummaryContentProps {
  project: any;
  lastReview: any;
  risks: any[];
  tasks: any[];
  isProjectManager?: boolean;
  isAdmin?: boolean;
  canEdit?: boolean;
  canManageTeam?: boolean;
}

export const ProjectSummaryContent = ({
  project,
  lastReview,
  risks,
  tasks,
}: ProjectSummaryContentProps) => {
  const projectId = project.id;

  // Charger les permissions de manière centralisée
  const projectPermissions = useProjectPermissions(projectId);

  console.log("🔍 ProjectSummaryContent - Permissions centralisées:", {
    projectId,
    permissions: projectPermissions,
    isLoading: !projectPermissions,
    component: "ProjectSummaryContent"
  });

  // Précharger les données de l'équipe directement ici
  const { data: teamProject } = useQuery({
    queryKey: ["teamProjectManager", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 300000, // 5 minutes
    enabled: !!projectId,
  });

  // Précharger les membres de l'équipe
  const { data: teamMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      console.log("🔍 ProjectSummaryContent - Début de la récupération des membres pour le projet:", projectId);
      
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          id,
          role,
          project_id,
          user_id,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name,
            user_roles (
              role
            )
          )
        `)
        .eq("project_id", projectId);

      if (error) {
        console.error("❌ ProjectSummaryContent - Erreur lors de la récupération des membres:", error);
        throw error;
      }
      
      console.log("📊 ProjectSummaryContent - Données brutes reçues:", data);
      
      // Transformation des données avec validation renforcée de l'ID
      const transformedData = data
        .filter(member => {
          // Filtrer les membres sans ID valide de manière plus stricte
          const hasValidId = member.id && 
                            member.id !== 'undefined' && 
                            member.id !== 'null' && 
                            typeof member.id === 'string' &&
                            member.id.length > 0;
          
          if (!hasValidId) {
            console.warn("⚠️ ProjectSummaryContent - Membre avec ID invalide filtré:", {
              member,
              id: member.id,
              type: typeof member.id
            });
            return false;
          }
          return true;
        })
        .map(member => {
          // S'assurer que l'ID du project_member est bien présent et valide
          const memberData = {
            id: member.id, // ID du project_member (crucial pour les mutations)
            user_id: member.user_id,
            role: member.role,
            project_id: member.project_id,
            profiles: member.profiles ? {
              id: member.profiles.id,
              email: member.profiles.email,
              first_name: member.profiles.first_name,
              last_name: member.profiles.last_name,
              roles: Array.isArray(member.profiles.user_roles) 
                ? member.profiles.user_roles.map((ur: any) => ur.role) 
                : []
            } : null
          };

          // Log détaillé pour vérifier que l'ID est bien présent
          console.log("✅ ProjectSummaryContent - Membre transformé avec validation:", {
            project_member_id: memberData.id,
            user_id: memberData.user_id,
            email: memberData.profiles?.email,
            hasValidId: !!memberData.id && 
                       memberData.id !== 'undefined' && 
                       memberData.id !== 'null' &&
                       typeof memberData.id === 'string' &&
                       memberData.id.length > 0,
            idType: typeof memberData.id,
            idLength: memberData.id?.length || 0
          });

          return memberData;
        });

      console.log("🎯 ProjectSummaryContent - Données finales transformées:", transformedData);
      console.log("📈 ProjectSummaryContent - Nombre de membres valides:", transformedData.length);
      
      return transformedData;
    },
    // Charger les membres seulement si les permissions sont disponibles
    enabled: !!projectId && !!projectPermissions && (projectPermissions.canManageTeam || projectPermissions.canEdit || projectPermissions.isAdmin),
    staleTime: 300000, // 5 minutes
  });

  // Utiliser uniquement les permissions du hook central
  const effectivePermissions = {
    canEdit: projectPermissions.canEdit,
    isProjectManager: projectPermissions.isProjectManager,
    isAdmin: projectPermissions.isAdmin,
    canManageTeam: projectPermissions.canManageTeam,
  };

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
              canEdit={effectivePermissions.canEdit}
              isProjectManager={effectivePermissions.isProjectManager}
              isAdmin={effectivePermissions.isAdmin}
            />
          </div>
        </TabsContent>
        <TabsContent value="risks">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <RiskList 
              projectId={projectId}
              projectTitle={project.title}
              canEdit={effectivePermissions.canEdit}
              isProjectManager={effectivePermissions.isProjectManager}
              isAdmin={effectivePermissions.isAdmin}
            />
          </div>
        </TabsContent>
        <TabsContent value="team">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
            <TeamManagement
              projectId={projectId}
              canEdit={effectivePermissions.canEdit}
              isProjectManager={effectivePermissions.isProjectManager}
              isAdmin={effectivePermissions.isAdmin}
              canManageTeam={effectivePermissions.canManageTeam}
              // Passer les données préchargées
              preloadedProject={teamProject}
              preloadedMembers={teamMembers}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
