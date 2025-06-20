
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProjectsListView } from "@/hooks/use-projects-list-view";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { useNavigate } from "react-router-dom";
import { FolderOpen, TrendingUp, CheckCircle, AlertTriangle, LayoutGrid } from "lucide-react";

interface CompactDashboardProps {
  onNewProject: () => void;
}

export const CompactDashboard = ({ onNewProject }: CompactDashboardProps) => {
  const navigate = useNavigate();
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

  // Projets nécessitant une attention
  const projectsNeedingAttention = projects.filter(project => {
    const now = new Date();
    const lastReview = project.last_review_date ? new Date(project.last_review_date) : null;
    const daysSinceReview = lastReview ? Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
    
    return daysSinceReview > 30 || !lastReview || 
           (project.lifecycle_status === 'in_progress' && (project.completion || 0) < 30);
  }).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Vue d'ensemble</CardTitle>
          <Button onClick={() => navigate("/projects")} variant="outline" size="sm">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Tous les projets
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Métriques principales en une ligne */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{totalProjects}</div>
            <div className="text-xs text-blue-600">Total projets</div>
            <div className="text-xs text-muted-foreground mt-1">
              {myProjects.length} sous ma responsabilité
            </div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700">{inProgressProjects.length}</div>
            <div className="text-xs text-orange-600">En cours</div>
            <div className="text-xs text-muted-foreground mt-1">
              {averageCompletion}% progression moy.
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700">{completedProjects.length}</div>
            <div className="text-xs text-green-600">Terminés</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalProjects > 0 ? Math.round((completedProjects.length / totalProjects) * 100) : 0}% du total
            </div>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-700">{projectsNeedingAttention}</div>
            <div className="text-xs text-red-600">Attention</div>
            <div className="text-xs text-muted-foreground mt-1">
              Revues en retard
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progression générale</span>
            <span>{averageCompletion}%</span>
          </div>
          <Progress value={averageCompletion} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
};
