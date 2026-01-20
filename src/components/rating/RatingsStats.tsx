/**
 * @component RatingsStats
 * @description Affiche les statistiques globales des évaluations
 * Note moyenne, nombre total d'évaluations et distribution des notes
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./StarRating";
import { Progress } from "@/components/ui/progress";
import type { RatingsStats as RatingsStatsType } from "@/types/rating";

interface RatingsStatsProps {
  stats: RatingsStatsType;
}

export const RatingsStats = ({ stats }: RatingsStatsProps) => {
  const { totalRatings, averageRating, distribution } = stats;

  // Calculer le pourcentage pour chaque note
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return (count / totalRatings) * 100;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Note moyenne */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Note moyenne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              {totalRatings > 0 ? averageRating.toFixed(1) : "-"}
            </div>
            <div className="flex flex-col gap-1">
              <StarRating value={Math.round(averageRating)} readonly size="md" />
              <span className="text-sm text-muted-foreground">
                {totalRatings} évaluation{totalRatings > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution des notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribution des notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const percentage = getPercentage(count);

              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-12 flex items-center gap-1">
                    {star} <span className="text-amber-500">★</span>
                  </span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
