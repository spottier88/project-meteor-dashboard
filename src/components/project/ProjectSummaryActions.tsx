import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateProjectPPTX } from "@/components/pptx/ProjectPPTX";

const ProjectSummaryActions = ({ project, risks, tasks }) => {
  const { toast } = useToast();

  const handleExportPPTX = async () => {
    try {
      const { data: lastReview } = await supabase
        .from("reviews")
        .select(`
          *,
          review_actions(*)
        `)
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const projectData = {
        project: {
          title: project.title,
          status: project.status,
          progress: project.progress,
          completion: project.completion,
          project_manager: project.project_manager,
          last_review_date: project.last_review_date,
          start_date: project.start_date,
          end_date: project.end_date,
          description: project.description,
          pole_name: project.poles?.name,
          direction_name: project.directions?.name,
          service_name: project.services?.name,
        },
        lastReview: lastReview ? {
          weather: lastReview.weather,
          progress: lastReview.progress,
          comment: lastReview.comment,
          created_at: lastReview.created_at,
          actions: lastReview.review_actions
        } : undefined,
        risks,
        tasks,
      };

      await generateProjectPPTX([projectData]);
      toast({
        title: "Export réussi",
        description: "Le fichier PPTX a été généré avec succès.",
      });
    } catch (error) {
      console.error("Error exporting to PPTX:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'export PPTX.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex space-x-4">
      <Button onClick={handleExportPPTX}>Exporter en PPTX</Button>
    </div>
  );
};

export default ProjectSummaryActions;
