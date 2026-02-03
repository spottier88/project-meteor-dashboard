/**
 * @component ProjectEvaluationTab
 * @description Onglet affichant l'évaluation de méthode projet pour les projets clôturés.
 * Affiche en lecture seule les 4 sections de l'évaluation :
 * - Ce qui a fonctionné
 * - Ce qui a manqué
 * - Améliorations proposées
 * - Leçons apprises
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectEvaluation } from "@/hooks/useProjectEvaluation";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, XCircle, Lightbulb, BookOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProjectEvaluationTabProps {
  projectId: string;
}

/**
 * Section d'évaluation avec icône et contenu
 */
const EvaluationSection = ({ 
  title, 
  content, 
  icon: Icon, 
  iconClassName 
}: { 
  title: string; 
  content: string | null;
  icon: React.ElementType;
  iconClassName: string;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className={`h-5 w-5 ${iconClassName}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {content ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Non renseigné</p>
      )}
    </CardContent>
  </Card>
);

export const ProjectEvaluationTab = ({ projectId }: ProjectEvaluationTabProps) => {
  const { data: evaluation, isLoading, error } = useProjectEvaluation(projectId);

  // État de chargement
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Erreur de chargement
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          Impossible de charger l'évaluation du projet.
        </AlertDescription>
      </Alert>
    );
  }

  // Pas d'évaluation trouvée
  if (!evaluation) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Aucune évaluation</AlertTitle>
        <AlertDescription>
          Ce projet n'a pas encore d'évaluation de méthode projet enregistrée.
          L'évaluation est normalement complétée lors de la clôture du projet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec date de création */}
      {evaluation.created_at && (
        <p className="text-sm text-muted-foreground">
          Évaluation réalisée le {new Date(evaluation.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>
      )}

      {/* Grille des sections d'évaluation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EvaluationSection
          title="Ce qui a fonctionné"
          content={evaluation.what_worked}
          icon={CheckCircle2}
          iconClassName="text-green-600"
        />

        <EvaluationSection
          title="Ce qui a manqué"
          content={evaluation.what_was_missing}
          icon={XCircle}
          iconClassName="text-red-500"
        />

        <EvaluationSection
          title="Améliorations proposées"
          content={evaluation.improvements}
          icon={Lightbulb}
          iconClassName="text-amber-500"
        />

        <EvaluationSection
          title="Leçons apprises"
          content={evaluation.lessons_learned}
          icon={BookOpen}
          iconClassName="text-blue-500"
        />
      </div>
    </div>
  );
};
