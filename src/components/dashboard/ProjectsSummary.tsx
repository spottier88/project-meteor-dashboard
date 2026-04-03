
/**
 * @component ProjectsSummary
 * @description Affiche une synthèse des projets de l'utilisateur avec des métriques clés.
 * Tous les indicateurs sont cliquables et redirigent vers la liste de projets filtrée.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Badge } from "@/components/ui/badge";
import { lifecycleStatusLabels } from "@/types/project";
import { StatusIcon } from "@/components/project/StatusIcon";
import { 
  FolderOpen, 
  User, 
  Users, 
  Eye, 
  Briefcase, 
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router";

/**
 * Carte d'indicateur principal avec icône et couleur
 */
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
  onClick?: () => void;
}

const MetricCard = ({ icon, label, value, colorClass, onClick }: MetricCardProps) => (
  <div 
    className={`flex flex-col items-center p-4 rounded-lg border ${colorClass} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    onClick={onClick}
  >
    <div className="mb-2">{icon}</div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs text-center text-muted-foreground mt-1">{label}</div>
  </div>
);

/**
 * Détermine la couleur de l'indicateur "sans revue" selon la gravité
 */
const getReviewAlertStyle = (count: number) => {
  if (count === 0) return { text: "text-green-600", bg: "bg-green-50 dark:bg-green-950" };
  if (count <= 3) return { text: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" };
  return { text: "text-red-600", bg: "bg-red-50 dark:bg-red-950" };
};

/**
 * Helper pour obtenir le label d'un statut météo
 */
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

/**
 * Écrit des filtres one-shot dans localStorage, réinitialise les filtres existants,
 * puis navigue vers /projects.
 */
const navigateWithDashboardFilter = (
  navigate: ReturnType<typeof useNavigate>,
  filters: Record<string, string>
) => {
  // Réinitialiser les filtres classiques pour éviter les conflits
  localStorage.removeItem("projectSearchQuery");
  localStorage.setItem("projectLifecycleStatus", "all");
  localStorage.setItem("projectMonitoringLevel", "all");
  localStorage.setItem("showMyProjectsOnly", "false");
  localStorage.setItem("projectPoleId", "all");
  localStorage.setItem("projectDirectionId", "all");
  localStorage.setItem("projectServiceId", "all");

  // Supprimer les anciens filtres dashboard
  localStorage.removeItem("dashboardRoleFilter");
  localStorage.removeItem("dashboardWeatherFilter");
  localStorage.removeItem("dashboardWithoutReviewFilter");

  // Écrire les nouveaux filtres dashboard
  Object.entries(filters).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  navigate("/projects");
};

export const ProjectsSummary = () => {
  const { summary, isLoading } = useDashboardData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Synthèse de mes projets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reviewAlertStyle = getReviewAlertStyle(summary.withoutReview);

  /** Handlers de navigation pour chaque indicateur */
  const handleTotalClick = () => navigateWithDashboardFilter(navigate, {});
  const handleCPClick = () => navigateWithDashboardFilter(navigate, { dashboardRoleFilter: "cp" });
  const handleMemberClick = () => navigateWithDashboardFilter(navigate, { dashboardRoleFilter: "member" });
  const handleManagerClick = () => navigateWithDashboardFilter(navigate, { dashboardRoleFilter: "manager" });
  const handleWithoutReviewClick = () => navigateWithDashboardFilter(navigate, { dashboardWithoutReviewFilter: "true" });
  const handleWeatherClick = (weather: string) => navigateWithDashboardFilter(navigate, { dashboardWeatherFilter: weather });
  const handleLifecycleClick = (lifecycle: string) => navigateWithDashboardFilter(navigate, { projectLifecycleStatus: lifecycle });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Synthèse de mes projets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Indicateurs principaux - Grille de cartes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<FolderOpen className="h-5 w-5 text-blue-600" />}
            label="Total"
            value={summary.total}
            colorClass="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
            onClick={summary.total > 0 ? handleTotalClick : undefined}
          />
          <MetricCard
            icon={<User className="h-5 w-5 text-green-600" />}
            label="Chef de projet"
            value={summary.asProjectManager}
            colorClass="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
            onClick={summary.asProjectManager > 0 ? handleCPClick : undefined}
          />
          <MetricCard
            icon={<Users className="h-5 w-5 text-orange-600" />}
            label="Membre"
            value={summary.asMember}
            colorClass="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
            onClick={summary.asMember > 0 ? handleMemberClick : undefined}
          />
          <MetricCard
            icon={<Eye className="h-5 w-5 text-purple-600" />}
            label="Vue Manager"
            value={summary.asHierarchyManager}
            colorClass="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
            onClick={summary.asHierarchyManager > 0 ? handleManagerClick : undefined}
          />
        </div>

        {/* Indicateurs secondaires - Ligne compacte */}
        <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-muted/50 rounded-lg">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/portfolios')}
          >
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Portefeuilles:</span>
            <Badge variant="secondary">{summary.portfolioCount}</Badge>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div 
            className={`flex items-center gap-2 px-2 py-1 rounded ${reviewAlertStyle.bg} ${summary.withoutReview > 0 ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={summary.withoutReview > 0 ? handleWithoutReviewClick : undefined}
          >
            <AlertTriangle className={`h-4 w-4 ${reviewAlertStyle.text}`} />
            <span className="text-sm font-medium">Sans revue récente:</span>
            <Badge 
              variant={summary.withoutReview === 0 ? "secondary" : "destructive"}
            >
              {summary.withoutReview}
            </Badge>
          </div>
        </div>

        {/* Répartition par statut météo */}
        {Object.keys(summary.byWeather).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Répartition par météo</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byWeather).map(([weather, count]) => (
                <Badge 
                  key={weather} 
                  variant="outline" 
                  className="flex items-center gap-1.5 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleWeatherClick(weather)}
                >
                  <StatusIcon 
                    status={weather === 'sunny' || weather === 'cloudy' || weather === 'stormy' ? weather : null} 
                    className="h-3.5 w-3.5" 
                  />
                  {getWeatherLabel(weather)}
                  <span className="ml-1 font-semibold">({count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Répartition par cycle de vie */}
        {Object.keys(summary.byLifecycle).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Répartition par cycle de vie</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byLifecycle).map(([lifecycle, count]) => (
                <Badge 
                  key={lifecycle} 
                  variant="secondary" 
                  className="py-1 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleLifecycleClick(lifecycle)}
                >
                  {lifecycleStatusLabels[lifecycle as keyof typeof lifecycleStatusLabels] || lifecycle}
                  <span className="ml-1 font-semibold">({count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
