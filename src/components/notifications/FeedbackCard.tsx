/**
 * @component FeedbackCard
 * @description Carte d'affichage d'un feedback utilisateur avec indicateur de réponse,
 * badge de sous-type (Bug, Évolution, Suppression, Droits) et boutons d'actions contextuels.
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare, Trash2, CheckCircle2, Clock, ListPlus, FolderX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Notification } from "@/types/notification";

/** Sous-type de feedback déduit du préfixe du titre */
export type FeedbackSubType = "bug" | "evolution" | "deletion" | "role" | "other";

/**
 * Déduit le sous-type d'un feedback à partir du préfixe de son titre
 */
export function getFeedbackSubType(title: string): FeedbackSubType {
  if (title.startsWith("[Bug]")) return "bug";
  if (title.startsWith("[Évolution]")) return "evolution";
  if (title.startsWith("[Suppression de projet]")) return "deletion";
  if (title.startsWith("[Demande de rôle]")) return "role";
  return "other";
}

/**
 * Retire le préfixe de type du titre pour l'affichage
 */
function cleanTitle(title: string): string {
  return title
    .replace(/^\[Bug\]\s*/, "")
    .replace(/^\[Évolution\]\s*/, "")
    .replace(/^\[Suppression de projet\]\s*/, "")
    .replace(/^\[Demande de rôle\]\s*/, "");
}

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
  /** Callback pour créer une tâche depuis un feedback évolution */
  onCreateTask?: (notification: Notification & { profiles: { email: string } | null }) => void;
  /** Callback pour supprimer un projet depuis un feedback suppression */
  onDeleteProject?: (notification: Notification & { profiles: { email: string } | null }) => void;
}

/** Configuration des badges de sous-type */
const subTypeBadgeConfig: Record<FeedbackSubType, { label: string; className: string }> = {
  bug: { label: "Bug", className: "bg-destructive text-destructive-foreground" },
  evolution: { label: "Évolution", className: "bg-purple-600 text-white" },
  deletion: { label: "Suppression", className: "bg-orange-500 text-white" },
  role: { label: "Droits", className: "bg-blue-600 text-white" },
  other: { label: "Autre", className: "bg-muted text-muted-foreground" },
};

export function FeedbackCard({
  feedback,
  response,
  onViewDetail,
  onRespond,
  onDelete,
  onCreateTask,
  onDeleteProject,
}: FeedbackCardProps) {
  const isResponded = !!response;
  const subType = getFeedbackSubType(feedback.title);
  const badgeConf = subTypeBadgeConfig[subType];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetail(feedback)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badges : statut répondu/en attente + sous-type */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {isResponded ? (
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Répondu
                </Badge>
              ) : (
                <Badge variant="warning">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              )}
              <Badge className={badgeConf.className}>{badgeConf.label}</Badge>
            </div>
            <h3 className="font-semibold text-sm truncate">{cleanTitle(feedback.title)}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              par {feedback.profiles?.email || "Inconnu"} ·{" "}
              {format(new Date(feedback.created_at), "dd/MM/yyyy", { locale: fr })}
            </p>
          </div>

          {/* Actions contextuelles */}
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Action spécifique : créer une tâche (évolution) */}
            {subType === "evolution" && onCreateTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateTask(feedback)}
                title="Créer une tâche"
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            )}
            {/* Action spécifique : supprimer le projet (suppression) */}
            {subType === "deletion" && onDeleteProject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteProject(feedback)}
                title="Supprimer le projet"
                className="text-destructive hover:text-destructive"
              >
                <FolderX className="h-4 w-4" />
              </Button>
            )}
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
