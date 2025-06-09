
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { 
  Plus, 
  History, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Settings,
  BookOpen,
  AlertTriangle
} from "lucide-react";

interface QuickActionsProps {
  onNewProject: () => void;
  onNewReview: () => void;
}

export const QuickActions = ({ onNewProject, onNewReview }: QuickActionsProps) => {
  const navigate = useNavigate();
  const { isAdmin, isManager, hasRole, isTimeTracker } = usePermissionsContext();

  const actions = [
    {
      title: "Nouveau projet",
      description: "Créer un nouveau projet",
      icon: Plus,
      action: onNewProject,
      color: "bg-blue-500",
      show: true
    },
    {
      title: "Nouvelle revue",
      description: "Effectuer une revue de projet",
      icon: History,
      action: onNewReview,
      color: "bg-green-500",
      show: true
    },
    {
      title: "Mes tâches",
      description: "Consulter mes tâches en cours",
      icon: ClipboardList,
      action: () => navigate("/my-tasks"),
      color: "bg-orange-500",
      show: isTimeTracker || isAdmin
    },
    {
      title: "Activités équipe",
      description: "Voir les activités de l'équipe",
      icon: Users,
      action: () => navigate("/team-activities"),
      color: "bg-purple-500",
      show: isAdmin || isManager || hasRole('chef_projet')
    },
    {
      title: "Mes activités",
      description: "Saisir mes activités",
      icon: BarChart3,
      action: () => navigate("/activities"),
      color: "bg-indigo-500",
      show: isTimeTracker || isAdmin
    },
    {
      title: "Administration",
      description: "Paramètres et gestion",
      icon: Settings,
      action: () => navigate("/admin"),
      color: "bg-red-500",
      show: isAdmin
    }
  ];

  const visibleActions = actions.filter(action => action.show);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:shadow-md transition-shadow"
              onClick={action.action}
            >
              <div className={`p-2 rounded-md ${action.color} text-white`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
