import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProjectPDF } from "@/components/ProjectPDF";
import { RiskList } from "@/components/RiskList";
import { TaskList } from "@/components/TaskList";
import { ReviewList } from "@/components/ReviewList";
import { ProjectHeader } from "@/components/ProjectHeader";

export const ProjectSummary = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading: isProjectLoading } = useQuery({
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

  const { data: risks, isLoading: isRisksLoading } = useQuery({
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

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
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

  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["reviews", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, review_actions(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const isLoading =
    isProjectLoading || isRisksLoading || isTasksLoading || isReviewsLoading;

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!project) {
    return <div>Projet non trouvé</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour au tableau de bord
      </Button>

      <ProjectHeader project={project} />

      <PDFDownloadLink
        document={<ProjectPDF project={project} risks={risks || []} lastReview={reviews?.[0]} />}
        fileName={`${project?.title || 'project'}-summary.pdf`}
      >
        {({ loading }) => (
          <Button disabled={loading || isLoading} variant="outline" size="sm">
            {loading ? "Génération..." : "Télécharger le PDF"}
            <FileDown className="ml-2 h-4 w-4" />
          </Button>
        )}
      </PDFDownloadLink>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="space-y-8">
          <RiskList projectId={projectId || ""} projectTitle={project.title} />
          <TaskList projectId={projectId || ""} />
        </div>
        <div>
          <ReviewList projectId={projectId || ""} />
        </div>
      </div>
    </div>
  );
};