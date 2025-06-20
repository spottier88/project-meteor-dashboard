
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { 
  Plus, 
  History, 
  FolderKanban,
  Settings,
  MoreVertical,
  Users,
  BarChart3,
  ClipboardList
} from "lucide-react";

interface StreamlinedQuickActionsProps {
  onNewProject: () => void;
  onNewReview: () => void;
}

export const StreamlinedQuickActions = ({ onNewProject, onNewReview }: StreamlinedQuickActionsProps) => {
  const navigate = useNavigate();
  const { isAdmin, isManager, hasRole, isTimeTracker } = usePermissionsContext();

  // Actions principales (toujours visibles)
  const primaryActions = [
    {
      title: "Nouveau projet",
      description: "Créer un nouveau projet",
      icon: Plus,
      action: onNewProject,
      color: "bg-blue-500 hover:bg-blue-600",
      show: true
    },
    {
      title: "Nouvelle revue",
      description: "Effectuer une revue de projet",
      icon: History,
      action: onNewReview,
      color: "bg-green-500 hover:bg-green-600",
      show: true
    },
    {
      title: "Mes projets",
      description: "Accéder à tous mes projets",
      icon: FolderKanban,
      action: () => navigate("/projects"),
      color: "bg-purple-500 hover:bg-purple-600",
      show: true
    }
  ];

  // Actions secondaires (dans le menu déroulant)
  const secondaryActions = [
    {
      title: "Portefeuilles",
      icon: FolderKanban,
      action: () => navigate("/portfolios"),
      show: isAdmin || hasRole('portfolio_manager')
    },
    {
      title: "Mes tâches",
      icon: ClipboardList,
      action: () => navigate("/my-tasks"),
      show: isTimeTracker || isAdmin
    },
    {
      title: "Activités équipe",
      icon: Users,
      action: () => navigate("/team-activities"),
      show: isAdmin || isManager || hasRole('chef_projet')
    },
    {
      title: "Mes activités",
      icon: BarChart3,
      action: () => navigate("/activities"),
      show: isTimeTracker || isAdmin
    },
    {
      title: "Administration",
      icon: Settings,
      action: () => navigate("/admin"),
      show: isAdmin
    }
  ];

  const visibleSecondaryActions = secondaryActions.filter(action => action.show);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {/* Actions principales */}
          {primaryActions.filter(action => action.show).map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`flex-1 h-16 flex flex-col items-center justify-center gap-2 text-white ${action.color} transition-colors`}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}

          {/* Menu des actions secondaires */}
          {visibleSecondaryActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-16 px-4 flex flex-col items-center justify-center gap-2"
                >
                  <MoreVertical className="h-5 w-5" />
                  <span className="text-sm">Plus</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {visibleSecondaryActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.action}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
