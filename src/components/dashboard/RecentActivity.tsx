
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import { Clock, Eye, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lifecycleStatusLabels } from "@/types/project";

export const RecentActivity = () => {
  const { data: projects = [] } = useProjectsListView();
  const navigate = useNavigate();

  // Projets nécessitant une attention (pas de revue récente, en retard, etc.)
  const projectsNeedingAttention = projects
    .filter(project => {
      const now = new Date();
      const lastReview = project.last_review_date ? new Date(project.last_review_date) : null;
      const daysSinceReview = lastReview ? Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
      
      return daysSinceReview > 30 || !lastReview || 
             (project.lifecycle_status === 'in_progress' && (project.completion || 0) < 30);
    })
    .slice(0, 5);

  // Projets récemment créés ou mis à jour
  const recentActivity = projects
    .sort((a, b) => {
      const dateA = new Date(a.last_review_date || a.review_created_at || 0);
      const dateB = new Date(b.last_review_date || b.review_created_at || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Attention requise
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectsNeedingAttention.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tous les projets sont à jour !
            </p>
          ) : (
            <div className="space-y-3">
              {projectsNeedingAttention.map((project) => {
                const lastReview = project.last_review_date ? new Date(project.last_review_date) : null;
                const daysSinceReview = lastReview 
                  ? Math.floor((new Date().getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
                  : Infinity;

                return (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {project.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {!lastReview 
                          ? "Aucune revue" 
                          : `Dernière revue: ${daysSinceReview}j`
                        }
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune activité récente
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {project.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {lifecycleStatusLabels[project.lifecycle_status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {project.completion}%
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
