
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useProjectCart } from "@/hooks/use-project-cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Presentation, GanttChartSquare, FileSpreadsheet } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { generateProjectPPTX } from "../pptx/ProjectPPTX";
import { useState } from "react";
import { ProjectGanttSheet } from "./ProjectGanttSheet";
import { exportProjectsToExcel } from "@/utils/projectExport";

interface ProjectCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCart = ({ isOpen, onClose }: ProjectCartProps) => {
  const { cartItems, removeFromCart, clearCart } = useProjectCart();
  const { toast } = useToast();
  const [isGanttOpen, setIsGanttOpen] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ["selectedProjects", cartItems],
    queryFn: async () => {
      if (cartItems.length === 0) return null;

      const fetchProjectData = async (projectId: string) => {
        try {
          const [projectResult, reviewResult] = await Promise.all([
            supabase
              .from("projects")
              .select("*")
              .eq("id", projectId)
              .maybeSingle(),
            supabase
              .from("latest_reviews")
              .select("*")
              .eq("project_id", projectId)
              .maybeSingle()
          ]);

          if (projectResult.error || !projectResult.data) {
            console.error("Error fetching project:", projectResult.error);
            return null;
          }

          // Récupérer les actions de la dernière revue
          let reviewActions = [];
          if (reviewResult.data?.review_id) {
            const { data: actionsData, error: actionsError } = await supabase
              .from("review_actions")
              .select("*")
              .eq("review_id", reviewResult.data.review_id);
              
            if (!actionsError) {
              reviewActions = actionsData || [];
            }
          }

          // Récupérer le code du projet
          const { data: codeData } = await supabase
            .from("project_codes")
            .select("code")
            .eq("project_id", projectId)
            .maybeSingle();

          // Récupérer les informations de cadrage
          const { data: framingData } = await supabase
            .from("project_framing")
            .select("*")
            .eq("project_id", projectId)
            .maybeSingle();

          // Récupérer les scores d'innovation
          const { data: innovationData } = await supabase
            .from("project_innovation_scores")
            .select("*")
            .eq("project_id", projectId)
            .maybeSingle();

          const [risksResult, tasksResult] = await Promise.all([
            supabase.from("risks").select("*").eq("project_id", projectId),
            supabase.from("tasks").select("*").eq("project_id", projectId),
          ]);

          const [poleResult, directionResult, serviceResult] = await Promise.all([
            projectResult.data.pole_id
              ? supabase.from("poles").select("name").eq("id", projectResult.data.pole_id).maybeSingle()
              : { data: null },
            projectResult.data.direction_id
              ? supabase.from("directions").select("name").eq("id", projectResult.data.direction_id).maybeSingle()
              : { data: null },
            projectResult.data.service_id
              ? supabase.from("services").select("name").eq("id", projectResult.data.service_id).maybeSingle()
              : { data: null },
          ]);

          // Récupérer l'information "Pour qui"
          let forEntityName = null;
          if (projectResult.data.for_entity_type && projectResult.data.for_entity_id) {
            const entityType = projectResult.data.for_entity_type;
            const entityId = projectResult.data.for_entity_id;
            
            let entityData = null;
            
            if (entityType === 'pole') {
              const { data } = await supabase
                .from("poles")
                .select("name")
                .eq("id", entityId)
                .maybeSingle();
              entityData = data;
            } else if (entityType === 'direction') {
              const { data } = await supabase
                .from("directions")
                .select("name")
                .eq("id", entityId)
                .maybeSingle();
              entityData = data;
            } else if (entityType === 'service') {
              const { data } = await supabase
                .from("services")
                .select("name")
                .eq("id", entityId)
                .maybeSingle();
              entityData = data;
            }
            
            forEntityName = entityData?.name || null;
          }

          // Récupérer les informations complètes du chef de projet
          let projectManagerName = null;
          if (projectResult.data.project_manager_id) {
            const { data: managerData } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", projectResult.data.project_manager_id)
              .maybeSingle();
              
            if (managerData) {
              projectManagerName = `${managerData.first_name || ''} ${managerData.last_name || ''}`.trim();
            }
          }

          return {
            project: {
              ...projectResult.data,
              completion: reviewResult.data?.completion || 0,
              weather: reviewResult.data?.weather || null,
              progress: reviewResult.data?.progress || null,
              pole_name: poleResult.data?.name,
              direction_name: directionResult.data?.name,
              service_name: serviceResult.data?.name,
              code: codeData?.code,
              project_manager_name: projectManagerName,
              for_entity_name: forEntityName // Ajouter le nom de l'entité pour laquelle le projet est réalisé
            },
            lastReview: reviewResult.data
              ? {
                  weather: reviewResult.data.weather,
                  progress: reviewResult.data.progress,
                  completion: reviewResult.data.completion,
                  comment: reviewResult.data.comment,
                  created_at: reviewResult.data.created_at,
                  actions: reviewActions,
                }
              : undefined,
            framing: framingData || undefined,
            innovation: innovationData || undefined,
            risks: risksResult.data || [],
            tasks: tasksResult.data || [],
          };
        } catch (error) {
          console.error("Error in fetchProjectData:", error);
          return null;
        }
      };

      const results = await Promise.all(cartItems.map(fetchProjectData));
      const validResults = results.filter((result): result is NonNullable<typeof result> => result !== null);
      
      if (validResults.length === 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de générer les exports pour les projets sélectionnés",
        });
        return null;
      }

      return validResults;
    },
    enabled: cartItems.length > 0,
  });

  const handlePPTXExport = async () => {
    if (!projectsData) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune donnée disponible pour l'export",
      });
      return;
    }

    try {
      await generateProjectPPTX(projectsData);
      toast({
        title: "Succès",
        description: "Présentation PowerPoint générée avec succès",
      });
    } catch (error) {
      console.error("Error generating PPTX:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer la présentation PowerPoint",
      });
    }
  };

  const handleExcelExport = () => {
    if (!projectsData) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune donnée disponible pour l'export",
      });
      return;
    }

    try {
      exportProjectsToExcel(projectsData);
      toast({
        title: "Succès",
        description: "Fichier Excel généré avec succès",
      });
    } catch (error) {
      console.error("Error generating Excel file:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le fichier Excel",
      });
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Projets sélectionnés ({cartItems.length})</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun projet dans le panier</p>
            ) : (
              <>
                <div className="space-y-4">
                  {projectsData?.map((data) => (
                    <div key={data.project.title} className="flex items-center justify-between">
                      <span>{data.project.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(cartItems[projectsData.indexOf(data)])}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => clearCart()}>
                    Vider le panier
                  </Button>
                  <div className="space-x-2">
                    {projectsData && (
                      <>
                        <Button onClick={handleExcelExport} variant="outline">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel
                        </Button>
                        <Button onClick={handlePPTXExport} variant="outline">
                          <Presentation className="h-4 w-4 mr-2" />
                          PPTX
                        </Button>
                        <Button onClick={() => setIsGanttOpen(true)} variant="outline">
                          <GanttChartSquare className="h-4 w-4 mr-2" />
                          Gantt
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ProjectGanttSheet
        isOpen={isGanttOpen}
        onClose={() => setIsGanttOpen(false)}
        projectIds={cartItems}
      />
    </>
  );
};
