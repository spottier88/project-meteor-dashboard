import { Button } from "@/components/ui/button";
import { RiskList } from "@/components/RiskList";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LastReview } from "@/components/LastReview";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { TaskForm } from "@/components/TaskForm";
import { InnovationRadarChart } from "../innovation/InnovationRadarChart";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

const criteriaDescriptions = {
  novateur: "Évalue le caractère innovant du projet : utilisation de nouvelles technologies, approches inédites, solutions créatives. Un score élevé indique une forte innovation technologique ou méthodologique.",
  usager: "Mesure l'implication des utilisateurs finaux dans la conception et le développement. Un score élevé signifie une forte prise en compte des besoins utilisateurs et des retours terrain.",
  ouverture: "Évalue le degré de collaboration et de partage : code source ouvert, données partagées, co-construction avec d'autres services. Un score élevé indique un projet très collaboratif.",
  agilite: "Mesure la capacité d'adaptation et d'itération rapide : cycles courts, tests fréquents, ajustements continus. Un score élevé reflète une approche très agile.",
  impact: "Évalue l'impact potentiel sur l'organisation : amélioration des processus, gains d'efficacité, bénéfices pour les agents. Un score élevé indique un fort potentiel de transformation."
};

interface ProjectSummaryContentProps {
  project: any;
  lastReview: any;
  risks: any[];
  tasks: any[];
  isProjectManager: boolean;
  isAdmin: boolean;
}

export const ProjectSummaryContent = ({
  project,
  lastReview,
  risks,
  tasks,
  isProjectManager,
  isAdmin,
}: ProjectSummaryContentProps) => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { userProfile, userRoles } = usePermissionsContext();

  const isManager = userRoles?.includes("manager");
  const canEdit = isAdmin || isManager || isProjectManager;

  const { data: innovationScores } = useQuery({
    queryKey: ["innovationScores", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_innovation_scores")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleTaskEdit = (task: any) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="grid gap-6">
      <ProjectSummaryHeader
        title={project.title}
        description={project.description}
        project_manager={project.project_manager}
        id={project.id}
        isProjectManager={isProjectManager}
        isAdmin={isAdmin}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Dernière revue</h2>
          <Card>
            {lastReview ? (
              <LastReview review={lastReview} />
            ) : (
              <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground text-center">
                  Aucune revue n'a encore été effectuée pour ce projet.
                </p>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Innovation</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-2">
                    {Object.entries(criteriaDescriptions).map(([key, description]) => (
                      <div key={key}>
                        <span className="font-bold capitalize">{key}</span>: {description}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Card>
            <CardContent className="pt-6">
              {innovationScores ? (
                <div className="h-[300px]">
                  <InnovationRadarChart
                    data={{
                      novateur: innovationScores.novateur,
                      usager: innovationScores.usager,
                      ouverture: innovationScores.ouverture,
                      agilite: innovationScores.agilite,
                      impact: innovationScores.impact,
                    }}
                  />
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    Les critères d'innovation n'ont pas encore été définis pour ce projet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tâches</h2>
          {canEdit && (
            <Button onClick={() => setIsTaskFormOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
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
        <RiskList 
          projectId={project.id} 
          projectTitle={project.title}
        />
      </div>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={handleTaskFormClose}
        projectId={project.id}
        task={selectedTask}
      />
    </div>
  );
};