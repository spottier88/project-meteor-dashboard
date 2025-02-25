
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GeneralSettings as GeneralSettingsComponent } from "@/components/admin/GeneralSettings";

export const GeneralSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <Settings className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres généraux</h1>
        <p className="text-muted-foreground">
          Configurez les paramètres globaux de l'application
        </p>
      </div>

      <div className="max-w-2xl">
        <GeneralSettingsComponent />
      </div>
    </div>
  );
};
