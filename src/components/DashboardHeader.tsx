import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  onNewProject: () => void;
  onNewReview: () => void;
}

const roleLabels = {
  admin: "Administrateur",
  direction: "Direction",
  chef_projet: "Chef de projet",
};

export const DashboardHeader = ({ onNewProject, onNewReview }: DashboardHeaderProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord des Projets</h1>
        <p className="text-muted-foreground">
          Suivez et évaluez l'état et la progression de vos projets
        </p>
        {profile && (
          <p className="text-sm text-muted-foreground mt-1">
            Connecté en tant que {profile.email} ({roleLabels[profile.role]})
          </p>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        {profile?.role === "admin" && (
          <Button
            variant="outline"
            onClick={() => navigate("/users")}
            className="w-full md:w-auto animate-fade-in"
          >
            <Users className="mr-2 h-4 w-4" />
            Gérer les utilisateurs
          </Button>
        )}
        <Button
          onClick={onNewProject}
          className="w-full md:w-auto animate-fade-in"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau Projet
        </Button>
        <Button
          onClick={onNewReview}
          variant="outline"
          className="w-full md:w-auto animate-fade-in"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Revue
        </Button>
        <Button
          onClick={() => signOut()}
          variant="outline"
          className="w-full md:w-auto animate-fade-in"
        >
          Déconnexion
        </Button>
      </div>
    </div>
  );
};