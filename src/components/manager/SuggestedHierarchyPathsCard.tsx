/**
 * @component SuggestedHierarchyPathsCard
 * @description Affiche les chemins hiérarchiques suggérés pour un manager
 * en se basant sur son affectation hiérarchique propre. Permet une
 * attribution en 1 clic (par ligne, "tout ajouter" ou "affectation directe").
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Sparkles, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSuggestedManagerPaths } from "@/hooks/useSuggestedManagerPaths";

interface SuggestedHierarchyPathsCardProps {
  userId: string;
  /** Ajout d'un chemin (utilise la même mutation que le formulaire manuel) */
  onAddPath: (pathId: string) => void;
  /** Ajout en masse (silencieux sur les doublons) */
  onAddPaths: (pathIds: string[]) => void;
}

export const SuggestedHierarchyPathsCard = ({
  userId,
  onAddPath,
  onAddPaths,
}: SuggestedHierarchyPathsCardProps) => {
  const { data, isLoading } = useSuggestedManagerPaths(userId);

  if (isLoading || !data) return null;

  const { isManager, directAssignments, suggestions } = data;

  // Cas : pas manager ou pas d'affectation → message d'aide
  if (!isManager || directAssignments.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Suggestions indisponibles</AlertTitle>
        <AlertDescription>
          {!isManager
            ? "L'utilisateur n'a pas le rôle Manager. Attribuez d'abord ce rôle pour bénéficier des suggestions automatiques."
            : "Renseignez l'affectation hiérarchique de l'utilisateur (pôle / direction / service) sur sa fiche pour bénéficier des suggestions automatiques."}
        </AlertDescription>
      </Alert>
    );
  }

  const pendingAll = suggestions.filter((s) => !s.isAlreadyAssigned);
  const pendingDirect = suggestions.filter(
    (s) => s.isDirect && !s.isAlreadyAssigned,
  );

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Affectations suggérées
        </CardTitle>
        <CardDescription>
          Calculées à partir de l'affectation hiérarchique de l'utilisateur.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onAddPaths(pendingDirect.map((s) => s.path.id))}
            disabled={pendingDirect.length === 0}
          >
            Affectation directe uniquement
            {pendingDirect.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingDirect.length}
              </Badge>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddPaths(pendingAll.map((s) => s.path.id))}
            disabled={pendingAll.length === 0}
          >
            Tout ajouter
            {pendingAll.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingAll.length}
              </Badge>
            )}
          </Button>
        </div>

        <div className="grid gap-2">
          {suggestions.map((s) => (
            <div
              key={s.path.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="font-medium truncate">
                  {s.path.path_string}
                </span>
                {s.isDirect && (
                  <Badge variant="default" className="shrink-0">
                    Affectation directe
                  </Badge>
                )}
                {!s.isDirect && (
                  <Badge variant="outline" className="shrink-0">
                    Périmètre étendu
                  </Badge>
                )}
                {s.isAlreadyAssigned && (
                  <Badge variant="secondary" className="shrink-0">
                    Déjà affecté
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddPath(s.path.id)}
                disabled={s.isAlreadyAssigned}
              >
                <Plus className="mr-1 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
