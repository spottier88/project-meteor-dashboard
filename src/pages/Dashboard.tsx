
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { ProjectsSummary } from "@/components/dashboard/ProjectsSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { UserInfo } from "@/components/UserInfo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { List } from "lucide-react";

const Dashboard = () => {
  const { isLoading: isPermissionsLoading, isError: isPermissionsError } = usePermissionsContext();

  if (isPermissionsLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isPermissionsError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600">
          Une erreur s'est produite lors du chargement des permissions.
          Veuillez rafraîchir la page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <UserInfo />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <Link to="/projects">
          <Button variant="outline">
            <List className="h-4 w-4 mr-2" />
            Voir tous les projets
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone de synthèse des projets */}
        <div className="lg:col-span-2">
          <ProjectsSummary />
        </div>

        {/* Zone d'actions rapides */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Zone d'alertes - en pleine largeur */}
      <div className="mt-6">
        <AlertsSection />
      </div>
    </div>
  );
};

export default Dashboard;
