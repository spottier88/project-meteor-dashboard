import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProjectPDF } from "@/components/ProjectPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Risk = Database["public"]["Tables"]["risks"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];

export const ProjectSummary = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [lastReview, setLastReview] = useState<Review | null>(null);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le projet.",
        variant: "destructive",
      });
      return null;
    }
    return data;
  };

  const fetchRisks = async () => {
    const { data, error } = await supabase
      .from("risks")
      .select("*")
      .eq("project_id", projectId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les risques.",
        variant: "destructive",
      });
      return [];
    }
    return data;
  };

  const fetchLastReview = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la dernière revue.",
        variant: "destructive",
      });
      return null;
    }
    return data;
  };

  useEffect(() => {
    const loadData = async () => {
      const projectData = await fetchProject();
      if (projectData) {
        setProject(projectData);
      }
      const risksData = await fetchRisks();
      setRisks(risksData);
      const lastReviewData = await fetchLastReview();
      setLastReview(lastReviewData);
    };

    loadData();
  }, [projectId]);

  if (!project) {
    return <div>Chargement du projet...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au tableau de bord
      </Button>
      <h1 className="text-2xl font-bold mb-4">{project?.title}</h1>
      <p>{project?.description}</p>
      
      <h2 className="text-xl font-semibold mt-6">Risques</h2>
      {risks.length === 0 ? (
        <p>Aucun risque identifié pour ce projet.</p>
      ) : (
        <ul>
          {risks.map((risk) => (
            <li key={risk.id}>{risk.description}</li>
          ))}
        </ul>
      )}
      <h2 className="text-xl font-semibold mt-6">Dernière Revue</h2>
      {lastReview ? (
        <div>
          <p>Météo: {lastReview.weather}</p>
          <p>Progression: {lastReview.progress}</p>
          <p>Commentaire: {lastReview.comment}</p>
        </div>
      ) : (
        <p>Aucune revue trouvée.</p>
      )}
      
      {project && (
        <PDFDownloadLink
          document={
            <ProjectPDF
              project={{
                title: project.title,
                status: project.status,
                progress: project.progress,
                completion: project.completion,
                project_manager: project.project_manager,
                last_review_date: project.last_review_date,
              }}
              lastReview={lastReview}
              risks={risks}
            />
          }
          fileName={`${project.title.toLowerCase().replace(/\s+/g, '-')}-rapport.pdf`}
        >
          {({ loading }) => (
            <Button className="mt-4" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Génération..." : "Télécharger le rapport"}
            </Button>
          )}
        </PDFDownloadLink>
      )}
    </div>
  );
};
