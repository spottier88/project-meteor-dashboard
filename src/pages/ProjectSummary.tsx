import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { Button } from "@/components/ui/button";
import { LastReview } from "@/components/LastReview";
import { TaskSummary } from "@/components/TaskSummary";
import { RiskSummary } from "@/components/RiskSummary";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProjectPDF } from "@/components/ProjectPDF";
import { ArrowLeft } from "lucide-react";

export const ProjectSummary = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: lastReview, isLoading: isLoadingReview } = useQuery({
    queryKey: ["lastReview", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: risks = [] } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
  });

  if (isLoadingProject || isLoadingReview) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-lg text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-lg text-destructive">Projet non trouvé</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Button>
        <PDFDownloadLink
          document={
            <ProjectPDF
              project={project}
              lastReview={lastReview}
              risks={risks}
              tasks={tasks}
            />
          }
          fileName={`${project.title.toLowerCase().replace(/\s+/g, "-")}.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading}>
              {loading ? "Génération du PDF..." : "Télécharger le PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <ProjectSummaryHeader
        title={project.title}
        description={project.description}
        status={project.status}
        progress={project.progress}
        completion={project.completion}
        project_manager={project.project_manager}
        last_review_date={project.last_review_date}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {lastReview && (
          <LastReview review={lastReview} />
        )}
        <TaskSummary projectId={projectId!} />
      </div>

      <RiskSummary projectId={projectId!} />
    </div>
  );
};