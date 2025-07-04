
/**
 * @component QuickActions
 * @description Zone d'actions rapides pour naviguer rapidement vers les fonctionnalités principales.
 * Affiche des boutons pour créer un projet, une revue, voir ses tâches, etc.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { Link } from "react-router-dom";
import { 
  Plus, 
  History, 
  CheckSquare, 
  Activity, 
  Settings,
  Users
} from "lucide-react";

interface QuickActionsProps {
  onNewProject?: () => void;
  onNewReview?: () => void;
}

export const QuickActions = ({ onNewProject, onNewReview }: QuickActionsProps) => {
  const { isAdmin, isTimeTracker, isProjectManager, isManager, hasRole } = usePermissionsContext();

  // Permissions pour créer un projet
  const canCreateProject = isAdmin || isProjectManager || hasRole('chef_projet');
  
  // Permissions pour faire une revue
  const canCreateReview = isAdmin || isProjectManager || hasRole('chef_projet');

  // Permissions pour accéder aux activités d'équipe
  const canViewTeamActivities = isAdmin || isManager || hasRole('chef_projet');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Actions principales */}
        {canCreateProject && (
          <Button 
            onClick={onNewProject} 
            variant="green"
            className="w-full justify-start" 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        )}

        {canCreateReview && (
          <Button 
            onClick={onNewReview} 
            className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700" 
            size="sm"
          >
            <History className="h-4 w-4 mr-2" />
            Nouvelle revue
          </Button>
        )}

        <Link to="/my-tasks" className="block">
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-orange-50 hover:border-orange-200" 
            size="sm"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Mes tâches
          </Button>
        </Link>

        {/* Actions spécifiques aux rôles */}
        {(isTimeTracker || isAdmin) && (
          <Link to="/activities" className="block">
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-purple-50 hover:border-purple-200" 
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              Mes activités
            </Button>
          </Link>
        )}

        {canViewTeamActivities && (
          <Link to="/team-activities" className="block">
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-teal-50 hover:border-teal-200" 
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Activités d'équipe
            </Button>
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className="block">
            <Button 
              variant="outline" 
              className="w-full justify-start hover:bg-gray-50 hover:border-gray-300" 
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Administration
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};
