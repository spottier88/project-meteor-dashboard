/**
 * @component EvaluationDetailsDialog
 * @description Dialogue affichant le détail complet d'une évaluation de projet
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvaluationWithProject } from "@/hooks/useAllEvaluations";
import { CheckCircle2, XCircle, Lightbulb, BookOpen, Calendar, User, Building2 } from "lucide-react";

interface EvaluationDetailsDialogProps {
  evaluation: EvaluationWithProject | null;
  isOpen: boolean;
  onClose: () => void;
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
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm font-medium">
        <Icon className={`h-4 w-4 ${iconClassName}`} />
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

export const EvaluationDetailsDialog = ({
  evaluation,
  isOpen,
  onClose,
}: EvaluationDetailsDialogProps) => {
  if (!evaluation) return null;

  const project = evaluation.project;

  // Construction de l'organisation
  const organizationParts = [];
  if (project?.pole?.name) organizationParts.push(project.pole.name);
  if (project?.direction?.name) organizationParts.push(project.direction.name);
  if (project?.service?.name) organizationParts.push(project.service.name);
  const organizationString = organizationParts.join(" > ") || "-";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {project?.title || "Évaluation de projet"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du projet */}
          <div className="flex flex-wrap gap-4 text-sm">
            {project?.project_manager && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Chef de projet:</span>
                <span>{project.project_manager}</span>
              </div>
            )}
            
            {project?.closed_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Clôturé le:</span>
                <span>
                  {new Date(project.closed_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
            )}
            
            {organizationParts.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Organisation:</span>
                <Badge variant="outline">{organizationString}</Badge>
              </div>
            )}
          </div>

          {/* Date d'évaluation */}
          {evaluation.created_at && (
            <p className="text-sm text-muted-foreground">
              Évaluation réalisée le{" "}
              {new Date(evaluation.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </p>
          )}

          {/* Sections d'évaluation */}
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
      </DialogContent>
    </Dialog>
  );
};
