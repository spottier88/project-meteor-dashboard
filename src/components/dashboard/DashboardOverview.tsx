import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { FolderOpen, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { PortfolioSummary } from "./PortfolioSummary";

interface DashboardOverviewProps {
  onNewProject: () => void;
  onViewAllProjects: () => void;
}

export const DashboardOverview = ({ 
  onNewProject, 
  onViewAllProjects 
}: DashboardOverviewProps) => {
  const { data: projects = [] } = useProjectsListView();
  const { userProfile } = usePermissionsContext();

  // Calculs des statistiques
  const totalProjects = projects.length;
  const myProjects = projects.filter(p => p.project_manager === userProfile?.email);
  const inProgressProjects = projects.filter(p => p.lifecycle_status === 'in_progress');
  const completedProjects = projects.filter(p => p.lifecycle_status === 'completed');
  const averageCompletion = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.completion || 0), 0) / projects.length)
    : 0;

  // Projets récents (dernières revues)
  const recentProjects = projects
    .filter(p => p.last_review_date)
    .sort((a, b) => new Date(b.last_review_date!).getTime() - new Date(a.last_review_date!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {myProjects.length} sous ma responsabilité
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Progression moyenne: {averageCompletion}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalProjects > 0 ? Math.round((completedProjects.length / totalProjects) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projets récents */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projets récemment mis à jour</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune mise à jour récente</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {project.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.project_manager_name || project.project_manager}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {project.completion}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.last_review_date && new Date(project.last_review_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" onClick={onViewAllProjects} className="w-full mt-4">
              Voir tous les projets
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progression globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avancement moyen</span>
                  <span>{averageCompletion}%</span>
                </div>
                <Progress value={averageCompletion} className="mt-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Étude</div>
                  <div className="font-medium">
                    {projects.filter(p => p.lifecycle_status === 'study').length}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">En cours</div>
                  <div className="font-medium">
                    {projects.filter(p => p.lifecycle_status === 'in_progress').length}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <PortfolioSummary />
      </div>
    </div>
  );
};
