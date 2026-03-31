/**
 * @component FeedbackCard
 * @description Carte d'affichage d'un feedback utilisateur avec indicateur de réponse.
 * Affiche le feedback original, son statut (répondu/en attente), et la réponse associée le cas échéant.
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Notification } from "@/types/notification";

interface FeedbackCardProps {
  /** Le feedback original */
  feedback: Notification & { profiles: { email: string } | null };
  /** La réponse associée (si elle existe) */
  response?: (Notification & { profiles: { email: string } | null }) | null;
  /** Callback pour ouvrir le détail */
  onViewDetail: (notification: Notification & { profiles: { email: string } | null }) => void;
  /** Callback pour répondre au feedback */
  onRespond: (notification: Notification & { profiles: { email: string } | null }) => void;
  /** Callback pour supprimer le feedback */
  onDelete: (id: string) => void;
}

export function FeedbackCard({
  feedback,
  response,
  onViewDetail,
  onRespond,
  onDelete,
}: FeedbackCardProps) {
  const isResponded = !!response;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetail(feedback)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badge statut répondu / en attente */}
            {isResponded ? (
              <Badge variant="default" className="mb-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Répondu
              </Badge>
            ) : (
              <Badge variant="warning" className="mb-2">
                <Clock className="h-3 w-3 mr-1" />
                En attente
              </Badge>
            )}
            <h3 className="font-semibold text-sm truncate">{feedback.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              par {feedback.profiles?.email || "Inconnu"} ·{" "}
              {format(new Date(feedback.created_at), "dd/MM/yyyy", { locale: fr })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!isResponded && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRespond(feedback)}
                title="Répondre"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(feedback.id)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Contenu tronqué du feedback */}
        <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
          {feedback.content}
        </p>

        {/* Réponse associée */}
        {response && (
          <div className="mt-3 pl-3 border-l-2 border-primary/30">
            <p className="text-xs font-medium text-muted-foreground">
              Réponse de {response.profiles?.email || "Admin"} ·{" "}
              {format(new Date(response.created_at), "dd/MM/yyyy", { locale: fr })}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {/* Extraire uniquement la partie réponse du contenu */}
              {extractResponseText(response.content)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Extrait le texte de réponse du contenu formaté "Votre demande: ...\n\nRéponse: ..."
 */
function extractResponseText(content: string): string {
  const marker = "Réponse: ";
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    return content.substring(idx + marker.length);
  }
  return content;
}
