
/**
 * @component AlertsSection
 * @description Section d'alertes affichant les projets nécessitant une attention particulière.
 * Identifie les projets sans revue depuis 3 mois ou sans activité récente.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectAlerts } from "@/hooks/use-project-alerts";
import { AlertTriangle, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusIcon } from "@/components/project/StatusIcon";

export const AlertsSection = () => {
  const { alerts, isLoading } = useProjectAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Projets nécessitant votre attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            Projets nécessitant votre attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aucun projet ne nécessite votre attention immédiate. Bon travail ! 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Projets nécessitant votre attention ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.project.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon status={alert.project.status} className="h-5 w-5" />
                <div>
                  <h4 className="font-medium">{alert.project.title}</h4>
                  <div className="flex gap-2 mt-1">
                    {alert.reasons.map((reason) => (
                      <Badge key={reason.type} variant="destructive" className="text-xs">
                        {reason.type === 'no_review' && (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pas de revue depuis {reason.daysSince} jours
                          </>
                        )}
                        {reason.type === 'no_activity' && (
                          <>
                            <Activity className="h-3 w-3 mr-1" />
                            Pas d'activité depuis {reason.daysSince} jours
                          </>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Link to={`/projects/${alert.project.id}`}>
                <Button size="sm" variant="outline">
                  Voir le projet
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
