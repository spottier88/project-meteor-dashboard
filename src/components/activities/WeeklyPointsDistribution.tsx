import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useActivityPointsQuota } from "@/hooks/useActivityPointsQuota";

interface WeeklyPointsDistributionProps {
  totalPointsUsed: number;
  weekStartDate: Date;
}

/**
 * Composant affichant la progression de distribution des points hebdomadaires
 * Affiche une barre de progression et des indicateurs visuels
 */
export const WeeklyPointsDistribution: React.FC<WeeklyPointsDistributionProps> = ({
  totalPointsUsed,
  weekStartDate,
}) => {
  const { quota } = useActivityPointsQuota();
  const percentageUsed = (totalPointsUsed / quota) * 100;
  const pointsRemaining = Math.max(0, quota - totalPointsUsed);
  const isComplete = totalPointsUsed >= quota;
  const isOverQuota = totalPointsUsed > quota;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Distribution des points</span>
          <Badge variant={isOverQuota ? "destructive" : isComplete ? "default" : "secondary"}>
            {totalPointsUsed} / {quota} points
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de progression */}
        <div className="space-y-2">
          <Progress 
            value={Math.min(percentageUsed, 100)} 
            className="h-3"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{percentageUsed.toFixed(0)}% utilisé</span>
            <span>{pointsRemaining} points restants</span>
          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm text-success">
                {isOverQuota 
                  ? `Vous avez dépassé le quota de ${totalPointsUsed - quota} point(s)`
                  : "Quota hebdomadaire atteint"}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">
                Il vous reste {pointsRemaining} point(s) à distribuer cette semaine
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
