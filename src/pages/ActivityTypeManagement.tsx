
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ActivityTypeManagement } from "@/components/activities/ActivityTypeManagement";

export const ActivityTypeManagementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
        <Settings className="mr-2 h-4 w-4" />
        Retour à l'administration
      </Button>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Gestion des types d'activités</h1>
      
      <ActivityTypeManagement />
    </div>
  );
};
