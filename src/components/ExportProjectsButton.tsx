import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { MultiProjectPDF } from "@/components/MultiProjectPDF";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ExportProjectsButton = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          poles (
            id,
            name
          ),
          directions (
            id,
            name
          ),
          services (
            id,
            name
          ),
          tasks (
            id,
            title,
            description,
            status,
            due_date,
            assignee
          ),
          risks (
            id,
            description,
            probability,
            severity,
            status,
            mitigation_plan
          ),
          reviews (
            id,
            weather,
            progress,
            comment,
            created_at,
            review_actions (
              id,
              description
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (projectsError) {
        throw projectsError;
      }

      return projectsData;
    },
  });

  if (isLoading) {
    return (
      <Button disabled>
        Chargement...
      </Button>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Button disabled>
        Aucun projet à exporter
      </Button>
    );
  }

  return (
    <div>
      {projects && (
        <PDFDownloadLink
          document={<MultiProjectPDF projects={projects} />}
          fileName="projets-export.pdf"
        >
          {({ loading }) => (
            <Button disabled={loading}>
              {loading ? "Génération..." : "Télécharger le PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      )}
    </div>
  );
};
