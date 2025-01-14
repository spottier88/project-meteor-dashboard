import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useProjectCart } from "@/hooks/use-project-cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Presentation } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { generateProjectPPTX } from "../pptx/ProjectPPTX";

interface ProjectCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCart = ({ isOpen, onClose }: ProjectCartProps) => {
  const { cartItems, removeFromCart, clearCart } = useProjectCart();
  const { toast } = useToast();

  const { data: projectsData } = useQuery({
    queryKey: ["selectedProjects", cartItems],
    queryFn: async () => {
      if (cartItems.length === 0) return null;

      const fetchProjectData = async (projectId: string) => {
        try {
          const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .maybeSingle();

          if (projectError || !projectData) {
            console.error("Error fetching project:", projectError);
            return null;
          }

          const [reviewResult, risksResult, tasksResult] = await Promise.all([
            supabase
              .from("reviews")
              .select(`
                *,
                review_actions(*)
              `)
              .eq("project_id", projectId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.from("risks").select("*").eq("project_id", projectId),
            supabase.from("tasks").select("*").eq("project_id", projectId),
          ]);

          console.log("Review data with actions:", reviewResult.data);

          const [poleResult, directionResult, serviceResult] = await Promise.all([
            projectData.pole_id
              ? supabase.from("poles").select("name").eq("id", projectData.pole_id).maybeSingle()
              : { data: null },
            projectData.direction_id
              ? supabase.from("directions").select("name").eq("id", projectData.direction_id).maybeSingle()
              : { data: null },
            projectData.service_id
              ? supabase.from("services").select("name").eq("id", projectData.service_id).maybeSingle()
              : { data: null },
          ]);

          return {
            project: {
              title: projectData.title,
              status: projectData.status,
              progress: projectData.progress,
              completion: projectData.completion,
              project_manager: projectData.project_manager,
              last_review_date: projectData.last_review_date,
              start_date: projectData.start_date,
              end_date: projectData.end_date,
              description: projectData.description,
              pole_name: poleResult.data?.name,
              direction_name: directionResult.data?.name,
              service_name: serviceResult.data?.name,
            },
            lastReview: reviewResult.data
              ? {
                  weather: reviewResult.data.weather,
                  progress: reviewResult.data.progress,
                  comment: reviewResult.data.comment,
                  created_at: reviewResult.data.created_at,
                  actions: reviewResult.data.review_actions,
                }
              : undefined,
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

  return (
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
                    <Button onClick={handlePPTXExport} variant="outline">
                      <Presentation className="h-4 w-4 mr-2" />
                      PPTX
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};