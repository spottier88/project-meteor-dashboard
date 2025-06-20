
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Eye, Calendar, Clock } from "lucide-react";
import { lifecycleStatusLabels } from "@/types/project";

export const PriorityProjects = () => {
  const { data: projects = [] } = useProjectsListView();
  const navigate = useNavigate();

  // Projets prioritaires (combinaison de récents et nécessitant attention)
  const priorityProjects = projects
    .map(project => {
      const now = new Date();
      const lastReview = project.last_review_date ? new Date(project.last_review_date) : null;
      const daysSinceReview = lastReview ? Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
      
      let priority = 0;
      let reason = "";
      
      // Critères de priorité
      if (!lastReview) {
        priority = 3;
        reason = "Aucune revue";
      } else if (daysSinceReview > 45) {
        priority = 3;
        reason = `Revue ancienne (${daysSinceReview}j)`;
      } else if (daysSinceReview > 30) {
        priority = 2;
        reason = `Revue en retard (${daysSinceReview}j)`;
      } else if (project.lifecycle_status === 'in_progress' && (project.completion || 0) < 30) {
        priority = 2;
        reason = "Faible progression";
      } else if (lastReview && daysSinceReview <= 7) {
        priority = 1;
        reason = "Récemment mis à jour";
      }
      
      return { ...project, priority, reason, daysSinceReview };
    })
    .filter(p => p.priority > 0)
    .sort((a, b) => b.priority - a.priority || (a.daysSinceReview - b.daysSinceReview))
    .slice(0, 8);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return "text-red-600 bg-red-50";
      case 2: return "text-orange-600 bg-orange-50";
      case 1: return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case 3: return <AlertTriangle className="h-4 w-4" />;
      case 2: return <Clock className="h-4 w-4" />;
      case 1: return <Calendar className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Projets prioritaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        {priorityProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>Tous vos projets sont à jour !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {priorityProjects.map((project) => (
              <div 
                key={project.id} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{project.title}</h4>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant="outline" className="text-xs">
                        {lifecycleStatusLabels[project.lifecycle_status]}
                      </Badge>
                      {project.completion !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {project.completion}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getPriorityColor(project.priority)}`}>
                      {getPriorityIcon(project.priority)}
                      <span>{project.reason}</span>
                    </div>
                    
                    {project.project_manager_name && (
                      <span className="text-xs text-muted-foreground">
                        • {project.project_manager_name}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {priorityProjects.length >= 8 && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/projects")} 
                className="w-full mt-4"
              >
                Voir tous les projets
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
