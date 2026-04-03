/**
 * @file ProjectPresentation.tsx
 * @description Page principale du mode présentateur pour les revues de projet.
 * Charge les projets du panier et affiche une présentation navigable.
 */

import { useNavigate } from "react-router";
import { useProjectCart } from "@/hooks/useProjectCart";
import { useDetailedProjectsData, ProjectData } from "@/hooks/useDetailedProjectsData";
import { PresentationView } from "@/components/presentation/PresentationView";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";


export const ProjectPresentation = () => {
  const navigate = useNavigate();
  const { cartItems } = useProjectCart();

  // Charger les données détaillées des projets
  const { data: projectsData, isLoading } = useDetailedProjectsData(
    cartItems,
    cartItems.length > 0
  );

  // Les projets sont triés dynamiquement dans PresentationView
  const projectsList = projectsData || [];

  // Fonction de sortie du mode présentateur
  const handleExit = () => {
    navigate("/projects");
  };

  // Si le panier est vide
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Aucun projet sélectionné</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Ajoutez des projets à votre panier depuis la liste des projets pour
          démarrer une présentation.
        </p>
        <Button onClick={() => void navigate("/projects")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  // Chargement des données
  if (isLoading || !projectsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingOverlay message="Chargement des données de présentation..." />
      </div>
    );
  }

  return (
    <PresentationView
      projects={projectsList}
      onExit={handleExit}
      showSummary={projectsList.length > 1}
    />
  );
};

export default ProjectPresentation;
