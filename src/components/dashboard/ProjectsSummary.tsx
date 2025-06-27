
/**
 * @component ProjectsSummary
 * @description Affiche une synthèse des projets de l'utilisateur avec des métriques clés.
 * Montre le nombre total de projets, leur répartition par statut et lifecycle.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Badge } from "@/components/ui/badge";
import { lifecycleStatusLabels } from "@/types/project";
import { StatusIcon } from "@/components/project/StatusIcon";

export const ProjectsSummary = () => {
  const { summary, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Synthèse de mes projets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fonction helper pour obtenir le label d'un statut météo
  const getWeatherLabel = (weather: string) => {
    switch (weather) {
      case 'sunny':
        return 'Beau temps';
      case 'cloudy':
        return 'Nuageux';
      case 'stormy':
        return 'Orageux';
      default:
        return 'Non évalué';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synthèse de mes projets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métriques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.asManager}</div>
            <div className="text-sm text-muted-foreground">Chef de projet</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.asMember}</div>
            <div className="text-sm text-muted-foreground">Membre</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.withAlerts}</div>
            <div className="text-sm text-muted-foreground">Alertes</div>
          </div>
        </div>

        {/* Répartition par statut météo */}
        <div>
          <h4 className="font-semibold mb-3">Répartition par météo</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byWeather).map(([weather, count]) => (
              <Badge key={weather} variant="outline" className="flex items-center gap-1">
                <StatusIcon status={weather === 'sunny' || weather === 'cloudy' || weather === 'stormy' ? weather : null} className="h-3 w-3" />
                {getWeatherLabel(weather)}
                <span className="ml-1">({count})</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Répartition par cycle de vie */}
        <div>
          <h4 className="font-semibold mb-3">Répartition par cycle de vie</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byLifecycle).map(([lifecycle, count]) => (
              <Badge key={lifecycle} variant="secondary">
                {lifecycleStatusLabels[lifecycle as keyof typeof lifecycleStatusLabels] || lifecycle}
                <span className="ml-1">({count})</span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
