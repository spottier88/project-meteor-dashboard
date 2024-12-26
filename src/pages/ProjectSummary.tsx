import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { ProjectStatus, ProgressStatus } from "@/components/ProjectCard";
import { KanbanBoard } from "@/components/KanbanBoard";
import { RiskSummary } from "@/components/RiskSummary";
import { ProjectPDF } from "@/components/ProjectPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Risk } from "@/types/risk";
import { ProjectSummaryHeader } from "@/components/project/ProjectSummaryHeader";
import { statusIcons } from "@/lib/project-status";

interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: ProgressStatus;
  completion: number;
  project_manager?: string;
  last_review_date: string;
}

interface Review {
  id: string;
  weather: ProjectStatus;
  progress: ProgressStatus;
  comment?: string;
  created_at: string;
}

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
} as const;

export const ProjectSummary = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
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
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as Review | null;
    },
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
      return data as Risk[];
    },
  });

  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux projets
        </Button>

        <PDFDownloadLink
          document={
            <ProjectPDF
              project={project}
              lastReview={lastReview}
              risks={risks || []}
            />
          }
          fileName={`${project.title.toLowerCase().replace(/\s+/g, "-")}-synthese.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading} type="button">
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Génération..." : "Exporter en PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="grid gap-6">
        <ProjectSummaryHeader {...project} />

        {lastReview && (
          <Card>
            <CardHeader>
              <CardTitle>Dernière revue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Date</span>
                    <p className="font-medium">
                      {new Date(lastReview.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Météo</span>
                    <p className="font-medium flex items-center gap-2">
                      {statusIcons[lastReview.weather].label}
                      {React.createElement(statusIcons[lastReview.weather].icon, {
                        className: statusIcons[lastReview.weather].color,
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">État d'évolution</span>
                    <p className="font-medium">{progressLabels[lastReview.progress]}</p>
                  </div>
                </div>
                {lastReview.comment && (
                  <div>
                    <span className="text-sm text-muted-foreground">Commentaires</span>
                    <p className="font-medium mt-1">{lastReview.comment}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <RiskSummary projectId={projectId || ""} />

        <Card>
          <CardHeader>
            <CardTitle>Tâches</CardTitle>
          </CardHeader>
          <CardContent>
            <KanbanBoard projectId={projectId || ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};