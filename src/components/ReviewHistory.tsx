import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudLightning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate, useParams, useLocation } from "react-router-dom";

interface ReviewHistoryProps {
  projectId?: string;
  projectTitle?: string;
  onClose?: () => void;
  standalone?: boolean;
}

const statusIcons = {
  sunny: { icon: Sun, color: "text-warning", label: "Ensoleillé" },
  cloudy: { icon: Cloud, color: "text-neutral", label: "Nuageux" },
  stormy: { icon: CloudLightning, color: "text-danger", label: "Orageux" },
};

const progressColors = {
  better: "text-success",
  stable: "text-neutral",
  worse: "text-danger",
};

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
};

export const ReviewHistory = ({ projectId: propProjectId, projectTitle: propProjectTitle, onClose, standalone = false }: ReviewHistoryProps) => {
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams();
  const location = useLocation();
  const projectTitle = propProjectTitle || location.state?.projectTitle;
  const finalProjectId = propProjectId || urlProjectId;

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", finalProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          review_actions (
            description
          )
        `)
        .eq("project_id", finalProjectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/");
    }
  };

  return (
    <div className={cn("space-y-6 animate-fade-in", standalone && "container mx-auto py-8")}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historique des revues - {projectTitle}</h2>
        <Button onClick={handleBack}>Retour</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement de l'historique...</p>
      ) : !reviews?.length ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucune revue n'a encore été saisie pour ce projet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => {
            const StatusIcon = statusIcons[review.weather].icon;
            return (
              <Card key={review.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        className={cn("w-5 h-5", statusIcons[review.weather].color)}
                        aria-label={statusIcons[review.weather].label}
                      />
                      <CardTitle className="text-lg">
                        {new Date(review.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </CardTitle>
                    </div>
                    <span className={cn("text-sm font-medium", progressColors[review.progress])}>
                      {progressLabels[review.progress]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {review.comment && (
                    <div>
                      <h4 className="font-medium mb-1">Commentaires</h4>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  )}
                  {review.review_actions?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">Actions à prendre</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {review.review_actions.map((action, index) => (
                          <li key={index}>{action.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};