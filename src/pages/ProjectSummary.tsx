import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProjectPDF } from "@/components/ProjectPDF";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";

export const ProjectSummary = () => {
  const { projectId } = useParams();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      return data;
    },
    enabled: !!projectId,
  });

  const { data: risks } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId);
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId);
      return data || [];
    },
    enabled: !!projectId,
  });

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <ProjectSummaryHeader
            title={project.title}
            description={project.description}
            status={project.status}
            progress={project.progress}
            completion={project.completion}
            project_manager={project.project_manager}
            last_review_date={project.last_review_date}
          />
        </div>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={
              <ProjectPDF
                project={project}
                risks={risks || []}
                tasks={tasks || []}
              />
            }
            fileName={`${project.title.toLowerCase().replace(/ /g, "-")}.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading}>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4" />
                      <span>Télécharger PDF</span>
                    </>
                  )}
                </div>
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <ProjectHeader project={project} />
    </div>
  );
};