/**
 * @file PortfolioReviewList.tsx
 * @description Liste des revues de portefeuille avec actions
 */

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Pencil,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PortfolioReview } from "@/hooks/usePortfolioReviews";
import { PortfolioReviewNotificationDialog } from "./PortfolioReviewNotificationDialog";

interface PortfolioReviewListProps {
  /** Liste des revues */
  reviews: PortfolioReview[];
  /** ID du portefeuille */
  portfolioId: string;
  /** Nom du portefeuille */
  portfolioName: string;
  /** Liste des projets du portefeuille */
  projects: { id: string; title: string; project_manager_id?: string | null }[];
  /** Callback d'édition */
  onEdit: (review: PortfolioReview) => void;
  /** Callback de suppression */
  onDelete: (reviewId: string) => void;
  /** Callback de changement de statut */
  onStatusChange: (reviewId: string, status: PortfolioReview["status"]) => void;
  /** Indique si une action est en cours */
  isLoading?: boolean;
}

/**
 * Configuration des statuts de revue
 */
const statusConfig: Record<
  PortfolioReview["status"],
  { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  planned: { label: "Planifiée", icon: Clock, variant: "secondary" },
  in_progress: { label: "En cours", icon: PlayCircle, variant: "default" },
  completed: { label: "Terminée", icon: CheckCircle2, variant: "outline" },
  cancelled: { label: "Annulée", icon: XCircle, variant: "destructive" },
};

/**
 * Liste des revues de portefeuille avec actions
 */
export const PortfolioReviewList = ({
  reviews,
  portfolioId,
  portfolioName,
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}: PortfolioReviewListProps) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notificationReview, setNotificationReview] = useState<PortfolioReview | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune revue organisée pour ce portefeuille.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {reviews.map((review) => {
          const config = statusConfig[review.status];
          const StatusIcon = config.icon;
          const reviewDate = new Date(review.review_date);
          const isPast = reviewDate < new Date() && review.status === "planned";

          return (
            <Card key={review.id} className={isPast ? "border-warning" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Informations de la revue */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium truncate">{review.subject}</h4>
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      {isPast && (
                        <Badge variant="outline" className="text-warning border-warning">
                          En retard
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(reviewDate, "EEEE d MMMM yyyy", { locale: fr })}
                      </span>
                    </div>

                    {review.notes && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {review.notes}
                      </p>
                    )}
                  </div>

                  {/* Barre d'outils avec actions directes */}
                  <div className="flex items-center gap-1">
                    {/* Notifier */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setNotificationReview(review)}
                          disabled={isLoading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Notifier les chefs de projet</TooltipContent>
                    </Tooltip>

                    {/* Statut: En cours */}
                    {review.status !== "in_progress" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onStatusChange(review.id, "in_progress")}
                            disabled={isLoading}
                          >
                            <PlayCircle className="h-4 w-4 text-blue-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marquer en cours</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Statut: Terminée */}
                    {review.status !== "completed" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onStatusChange(review.id, "completed")}
                            disabled={isLoading}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marquer terminée</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Statut: Annulée */}
                    {review.status !== "cancelled" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onStatusChange(review.id, "cancelled")}
                            disabled={isLoading}
                          >
                            <XCircle className="h-4 w-4 text-orange-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Annuler la revue</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Modifier */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(review)}
                          disabled={isLoading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Modifier</TooltipContent>
                    </Tooltip>

                    {/* Supprimer */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(review.id)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Supprimer</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmId(null);
          }
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.body.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette revue ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La revue et son historique de
              notifications seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog d'envoi de notifications */}
      {notificationReview && (
        <PortfolioReviewNotificationDialog
          open={!!notificationReview}
          onClose={() => setNotificationReview(null)}
          portfolioId={portfolioId}
          portfolioName={portfolioName}
          review={notificationReview}
          projects={projects}
        />
      )}
    </>
  );
};
