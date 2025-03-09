
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FrameworkNoteSection } from "@/components/project/FrameworkNoteSection";
import { useToast } from "@/components/ui/use-toast";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";

export const FrameworkNotes = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit } = useProjectPermissions(projectId || "");

  const { data: project, isError: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) {
        navigate("/");
        return null;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger le projet",
        });
        throw error;
      }
      
      if (!data) {
        toast({
          variant: "destructive",
          title: "Projet non trouvé",
          description: "Le projet demandé n'existe pas",
        });
        navigate("/");
        return null;
      }
      
      return data;
    },
    enabled: !!projectId,
  });

  if (!project || projectError) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au projet
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
        <FrameworkNoteSection
          project={project}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
};
