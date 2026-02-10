/**
 * @file PortfolioReviewNotificationHistory.tsx
 * @description Affiche l'historique des envois de notifications pour une revue de portefeuille
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Loader2 } from "lucide-react";
import { useReviewNotificationHistory } from "@/hooks/usePortfolioReviews";

interface PortfolioReviewNotificationHistoryProps {
  /** ID de la revue */
  reviewId: string;
}

/**
 * Composant affichant l'historique des envois de notifications pour une revue
 */
export const PortfolioReviewNotificationHistory = ({
  reviewId,
}: PortfolioReviewNotificationHistoryProps) => {
  const { data: notifications, isLoading } = useReviewNotificationHistory(reviewId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        Chargement...
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Aucune notification envoyée pour cette revue.
      </p>
    );
  }

  return (
    <div className="space-y-2 pt-2 border-t mt-2">
      <p className="text-xs font-medium text-muted-foreground">Historique des envois</p>
      {notifications.map((notif: any) => {
        const senderProfile = notif.profiles;
        const senderName = senderProfile
          ? [senderProfile.first_name, senderProfile.last_name].filter(Boolean).join(" ") || senderProfile.email
          : "Inconnu";
        const templateName = notif.email_templates?.name;

        return (
          <div key={notif.id} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 mt-0.5 shrink-0" />
            <div>
              <span>
                {format(new Date(notif.sent_at), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                {" — par "}
                <span className="font-medium text-foreground">{senderName}</span>
              </span>
              <div>
                {notif.recipient_count} destinataire{notif.recipient_count > 1 ? "s" : ""}
                {templateName && ` — Modèle : "${templateName}"`}
              </div>
              {notif.message && (
                <div className="italic truncate max-w-[400px]">
                  « {notif.message} »
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
