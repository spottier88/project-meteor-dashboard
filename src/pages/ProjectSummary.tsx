import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ProjectPDF } from "@/components/pdf/ProjectPDF";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { ProjectSummaryTabs } from "@/components/project/ProjectSummaryTabs";

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

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {project && <ProjectSummaryHeader project={project} />}
        </div>
        <div className="flex gap-2">
          {project && (
            <PDFDownloadLink
              document={<ProjectPDF project={project} />}
              fileName={`${project.title.toLowerCase().replace(/ /g, '-')}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Génération...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      Télécharger PDF
                    </div>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      <ProjectHeader project={project} />
      <ProjectSummaryTabs project={project} />
    </div>
  );
};