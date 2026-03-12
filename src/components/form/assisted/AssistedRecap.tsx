/**
 * Récapitulatif final du wizard assisté.
 * Affiche toutes les données saisies sous forme de sections cliquables
 * permettant de revenir à l'étape correspondante pour modifier.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { ProjectFormState } from "../useProjectFormState";
import { lifecycleStatusLabels } from "@/types/project";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AssistedRecapProps {
  formState: ProjectFormState;
  /** Naviguer vers une étape spécifique */
  onGoToStep: (step: number) => void;
}

/** Section du récapitulatif avec un lien d'édition */
const RecapSection = ({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) => (
  <Card className="overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
      <h4 className="text-sm font-medium">{title}</h4>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onEdit(stepIndex)}
        className="h-7 px-2"
      >
        <Pencil className="h-3 w-3 mr-1" />
        Modifier
      </Button>
    </div>
    <CardContent className="py-3 px-4 text-sm space-y-1">
      {children}
    </CardContent>
  </Card>
);

/** Ligne de détail du récapitulatif */
const RecapLine = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex gap-2">
    <span className="text-muted-foreground min-w-[120px]">{label} :</span>
    <span className="font-medium">{value || <span className="text-muted-foreground italic">Non renseigné</span>}</span>
  </div>
);

const priorityLabels: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

export const AssistedRecap = ({ formState, onGoToStep }: AssistedRecapProps) => {
  const formatDate = (date?: Date) => {
    if (!date) return null;
    return format(date, "dd MMMM yyyy", { locale: fr });
  };

  return (
    <div className="space-y-3">
      {/* Étape 0 : Titre et description */}
      <RecapSection title="Projet" stepIndex={0} onEdit={onGoToStep}>
        <RecapLine label="Titre" value={formState.title} />
        <RecapLine label="Description" value={formState.description} />
      </RecapSection>

      {/* Étape 1 : Chef de projet */}
      <RecapSection title="Chef de projet" stepIndex={1} onEdit={onGoToStep}>
        <RecapLine label="Email" value={formState.projectManager} />
      </RecapSection>

      {/* Étape 2 : Dates */}
      <RecapSection title="Dates" stepIndex={2} onEdit={onGoToStep}>
        <RecapLine label="Début" value={formatDate(formState.startDate)} />
        <RecapLine label="Fin" value={formatDate(formState.endDate)} />
      </RecapSection>

      {/* Étape 3 : Statut et priorité */}
      <RecapSection title="Statut et priorité" stepIndex={3} onEdit={onGoToStep}>
        <RecapLine label="Statut" value={lifecycleStatusLabels[formState.lifecycleStatus]} />
        <RecapLine label="Priorité" value={priorityLabels[formState.priority] || formState.priority} />
      </RecapSection>

      {/* Étape 4 : Organisation */}
      <RecapSection title="Organisation" stepIndex={4} onEdit={onGoToStep}>
        <div className="flex gap-2">
          <span className="text-muted-foreground min-w-[120px]">Portefeuilles :</span>
          <span>{formState.portfolioIds.length > 0 ? `${formState.portfolioIds.length} sélectionné(s)` : <span className="text-muted-foreground italic">Aucun</span>}</span>
        </div>
        {formState.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {formState.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        <RecapLine label="Lien Teams" value={formState.teamsUrl} />
      </RecapSection>

      {/* Étapes optionnelles - afficher uniquement si renseignées */}
      {formState.monitoringLevel !== "none" && (
        <RecapSection title="Suivi" stepIndex={5} onEdit={onGoToStep}>
          <RecapLine label="Niveau" value={formState.monitoringLevel} />
        </RecapSection>
      )}

      {(formState.novateur > 0 || formState.usager > 0 || formState.ouverture > 0 || formState.agilite > 0 || formState.impact > 0) && (
        <RecapSection title="Innovation" stepIndex={6} onEdit={onGoToStep}>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline">Novateur: {formState.novateur}</Badge>
            <Badge variant="outline">Usager: {formState.usager}</Badge>
            <Badge variant="outline">Ouverture: {formState.ouverture}</Badge>
            <Badge variant="outline">Agilité: {formState.agilite}</Badge>
            <Badge variant="outline">Impact: {formState.impact}</Badge>
          </div>
        </RecapSection>
      )}

      {(formState.context || formState.objectives) && (
        <RecapSection title="Cadrage" stepIndex={7} onEdit={onGoToStep}>
          <RecapLine label="Contexte" value={formState.context ? "Renseigné" : null} />
          <RecapLine label="Objectifs" value={formState.objectives ? "Renseigné" : null} />
          <RecapLine label="Livrables" value={formState.deliverables ? "Renseigné" : null} />
        </RecapSection>
      )}
    </div>
  );
};
