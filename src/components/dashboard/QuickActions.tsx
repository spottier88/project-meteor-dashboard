
/**
 * @component QuickActions
 * @description Zone d'actions rapides pour naviguer rapidement vers les fonctionnalités principales.
 * Affiche des boutons pour créer un projet, une revue, voir ses tâches, etc.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  History, 
  CheckSquare, 
  Activity, 
  Users, 
  Settings 
} from "lucide-react";

export const QuickActions = () => {
  const navigate = useNavigate();
  const { isAdmin, isTimeTracker } = usePermissionsContext();

  const handleNewProject = () => {
    navigate("/projects", { state: { openProjectForm: true } });
  };

  const handleNewReview = () => {
    navigate("/projects", { state: { openReviewSelection: true } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Actions principales */}
        <Button 
          onClick={handleNewProject} 
          className="w-full justify-start" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>

        <Button 
          onClick={handleNewReview} 
          variant="outline" 
          className="w-full justify-start" 
          size="sm"
        >
          <History className="h-4 w-4 mr-2" />
          Nouvelle revue
        </Button>

        <Link to="/my-tasks" className="block">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
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
              className="w-full justify-start" 
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              Mes activités
            </Button>
          </Link>
        )}

        {isAdmin && (
          <>
            <Link to="/admin/users" className="block">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Gestion utilisateurs
              </Button>
            </Link>

            <Link to="/admin" className="block">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Administration
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};
