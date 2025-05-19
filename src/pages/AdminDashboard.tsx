
import { Settings, Users, Building2, Bell, Activity, BookOpenText, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres et les utilisateurs de l'application
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate("/admin/users")}
        >
          <Users className="h-8 w-8" />
          <span>Gestion des utilisateurs</span>
        </Button>

        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate("/admin/organization")}
        >
          <Building2 className="h-8 w-8" />
          <span>Gestion de l'organisation</span>
        </Button>

        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate("/admin/notifications")}
        >
          <Bell className="h-8 w-8" />
          <span>Gestion des notifications</span>
        </Button>

        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate("/admin/activity-types")}
        >
          <Activity className="h-8 w-8" />
          <span>Types d'activités</span>
        </Button>

        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate("/admin/settings")}
        >
          <Settings className="h-8 w-8" />
          <span>Paramètres généraux</span>
        </Button>

        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate("/admin/ai-prompts")}
        >
          <BookOpenText className="h-8 w-8" />
          <span>Templates IA</span>
        </Button>

        <Button
          variant="outline"
          className="h-32 flex flex-col items-center justify-center gap-2"
          onClick={() => navigate("/admin/templates")}
        >
          <FileText className="h-8 w-8" />
          <span>Modèles de projet</span>
        </Button>
      </div>
    </div>
  );
};
