import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sun, Cloud, CloudLightning, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteReviewDialog } from "./DeleteReviewDialog";
import { useReviewAccess } from "@/hooks/useReviewAccess";

/** Icônes et couleurs associées à la météo du projet */
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

interface ReviewHistoryDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modale affichant l'historique complet des revues d'un projet.
 * Permet la suppression de revues si l'utilisateur en a les droits.
 */
export const ReviewHistoryDialog = ({ projectId, isOpen, onClose }: ReviewHistoryDialogProps) => {
  const [selectedReview, setSelectedReview] = useState<{ id: string; date: string } | null>(null);
  const { canDeleteReview } = useReviewAccess(projectId);

  /** Récupération des revues et de leurs actions associées */
  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ["reviews", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          review_actions (
            description
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
    staleTime: 0,
  });

  const handleDeleteClick = (reviewId: string, date: string) => {
    setSelectedReview({ id: reviewId, date });
  };

  const handleCloseDeleteDialog = () => {
    setSelectedReview(null);
  };

  const handleReviewDeleted = async () => {
    await refetch();
  };

  /** Nettoyage des pointer-events à la fermeture pour éviter les blocages d'interface */
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.documentElement.style.pointerEvents = "";
      }, 0);
    }
  };

  /** Empêche la propagation des clics sur l'overlay vers les éléments parents (ex: carte projet) */
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div onClick={handleOverlayClick}>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" onClick={handleOverlayClick}>
          <DialogHeader>
            <DialogTitle>Historique des revues</DialogTitle>
          </DialogHeader>

          {/* Contenu scrollable */}
          <div className="overflow-y-auto max-h-[70vh] space-y-4 pr-2">
            {isLoading ? (
              <p className="text-muted-foreground">Chargement de l'historique...</p>
            ) : !reviews?.length ? (
              <p className="text-center text-muted-foreground py-4">
                Aucune revue n'a encore été saisie pour ce projet.
              </p>
            ) : (
              reviews.map((review) => {
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
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium", progressColors[review.progress])}>
                            {progressLabels[review.progress]}
                          </span>
                          {canDeleteReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 ml-2"
                              onClick={() => handleDeleteClick(review.id, review.created_at)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {review.comment && (
                        <div>
                          <h4 className="font-medium mb-1">Situation générale</h4>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      )}
                      {review.review_actions?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-1">Actions à prendre</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {review.review_actions.map((action: { description: string }, index: number) => (
                              <li key={index}>{action.description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale imbriquée de suppression */}
      {selectedReview && (
        <DeleteReviewDialog
          isOpen={!!selectedReview}
          onClose={handleCloseDeleteDialog}
          reviewId={selectedReview.id}
          projectId={projectId}
          reviewDate={selectedReview.date}
          onReviewDeleted={handleReviewDeleted}
        />
      )}
    </div>
  );
};
