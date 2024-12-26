import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { ProjectPDF } from "@/components/ProjectPDF";
import { RiskList } from "@/components/RiskList";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LastReview } from "@/components/LastReview";
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

  const { data: lastReview } = useQuery({
    queryKey: ["lastReview", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
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
          document={
            <ProjectPDF
              project={project}
              lastReview={lastReview || undefined}
              risks={risks || []}
              tasks={tasks || []}
            />
          }
          fileName={`${project.title}.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading} type="button">
              <FileDown className="h-4 w-4 mr-2" />
              {loading ? "Génération..." : "Télécharger le PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="grid gap-6">
        {lastReview && (
          <div className="max-w-xl mx-auto">
            <LastReview review={lastReview} />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Tâches</h2>
          <KanbanBoard projectId={projectId} />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Risques</h2>
          <RiskList projectId={projectId} projectTitle={project.title} />
        </div>
      </div>
    </div>
  );
};