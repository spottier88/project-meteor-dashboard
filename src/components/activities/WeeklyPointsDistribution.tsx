import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useActivityPointsQuota } from "@/hooks/useActivityPointsQuota";
import { PointsVisualization } from "./PointsVisualization";

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
    <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Distribution des points</span>
          <div className="flex items-center gap-3">
            <PointsVisualization points={totalPointsUsed} size="md" />
            <span className="text-muted-foreground">/</span>
            <PointsVisualization points={quota} size="md" animated={false} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de progression avec animation */}
        <div className="space-y-2">
          <Progress 
            value={Math.min(percentageUsed, 100)} 
            className={`h-3 transition-all duration-500 ${
              isOverQuota 
                ? 'bg-destructive/20' 
                : isComplete 
                  ? 'bg-success/20' 
                  : 'bg-amber-100'
            }`}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="font-medium">{percentageUsed.toFixed(0)}% utilisé</span>
            <span>{pointsRemaining} points restants</span>
          </div>
        </div>

        {/* Statut avec animation */}
        <div className={`
          flex items-center gap-2 p-3 rounded-lg
          transition-all duration-300
          ${isComplete 
            ? 'bg-success/10 border border-success/20' 
            : 'bg-amber-50 border border-amber-200'
          }
        `}>
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-success animate-scale-in" />
              <span className="text-sm text-success font-medium">
                {isOverQuota 
                  ? `Vous avez dépassé le quota de ${totalPointsUsed - quota} point(s)`
                  : "🎉 Quota hebdomadaire atteint !"}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-900">
                Il vous reste <span className="font-semibold">{pointsRemaining} point(s)</span> à distribuer cette semaine
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
