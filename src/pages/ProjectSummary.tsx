import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { ProjectPDF } from "@/components/ProjectPDF";
import { RiskList } from "@/components/RiskList";
import { TaskList } from "@/components/TaskList";
import { ReviewList } from "@/components/ReviewList";
import { ProjectHeader } from "@/components/ProjectHeader";

export const ProjectSummary = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project } = useQuery({
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
    enabled: !!projectId,
  });

  const { data: risks } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (!project || !projectId) return null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <ProjectHeader project={project} />
        <PDFDownloadLink
          document={<ProjectPDF project={project} risks={risks || []} tasks={tasks || []} />}
          fileName={`${project.title}.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading}>
              <FileDown className="h-4 w-4 mr-2" />
              {loading ? "Génération..." : "Télécharger le PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <RiskList projectId={projectId} projectTitle={project.title} />
          <TaskList projectId={projectId} />
        </div>
        <ReviewList projectId={projectId} />
      </div>
    </div>
  );
};