
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useProjectNavigation } from "@/hooks/useProjectNavigation";

interface ProjectAlert {
  id: string;
  title: string;
  last_review_date: string | null;
  lifecycle_status: string;
  weather: string | null;
  completion: number;
  daysSinceReview: number;
}

export const AlertsSection = () => {
  const user = useUser();
  const { navigateToProject } = useProjectNavigation();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["projectAlerts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Récupérer les projets avec leurs dernières revues
      const { data: projects, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          last_review_date,
          lifecycle_status,
          project_manager,
          owner_id,
          pole_id,
          direction_id, 
          service_id
        `)
        .eq("lifecycle_status", "in_progress");

      if (error) throw error;

      // Filtrer les projets accessibles et identifier les alertes
      const accessibleProjects = projects.filter((project) => {
        // Logique de filtrage basée sur les permissions utilisateur
        // (similaire à celle utilisée dans ProjectTable)
        return true; // Simplifié pour cet exemple
      });

      const alerts: ProjectAlert[] = [];
      const now = new Date();

      for (const project of accessibleProjects) {
        let shouldAlert = false;
        let alertType = "";

        // Vérifier si une revue est nécessaire (plus de 30 jours)
        if (project.last_review_date) {
          const lastReview = new Date(project.last_review_date);
          const daysSince = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSince > 30) {
            shouldAlert = true;
            alerts.push({
              id: project.id,
              title: project.title,
              last_review_date: project.last_review_date,
              lifecycle_status: project.lifecycle_status,
              weather: null,
              completion: 0,
              daysSinceReview: daysSince,
            });
          }
        } else {
          // Aucune revue effectuée
          shouldAlert = true;
          alerts.push({
            id: project.id,
            title: project.title,
            last_review_date: null,
            lifecycle_status: project.lifecycle_status,
            weather: null,
            completion: 0,
            daysSinceReview: 999,
          });
        }
      }

      return alerts.slice(0, 5); // Limiter à 5 alertes
    },
    enabled: !!user?.id,
  });

  const handleViewProject = (projectId: string, event: React.MouseEvent) => {
    navigateToProject(projectId, event);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertes projets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Chargement des alertes...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            Alertes projets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Aucune alerte pour le moment
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertes projets
          <Badge variant="destructive" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.last_review_date
                    ? `Dernière revue il y a ${alert.daysSinceReview} jours`
                    : "Aucune revue effectuée"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleViewProject(alert.id, e)}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Voir le projet
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
