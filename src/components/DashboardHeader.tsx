
import { Button } from "@/components/ui/button";
import { Plus, History, Calendar } from "lucide-react";
import { CartButton } from "./cart/CartButton";
import { ProjectCart } from "./cart/ProjectCart";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  onNewProject: () => void;
  onNewReview: () => void;
}

export const DashboardHeader = ({ onNewProject, onNewReview }: DashboardHeaderProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div onClick={() => setIsCartOpen(true)}>
          <CartButton />
        </div>
        <Button onClick={() => navigate('/activities')} variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Mes activités
        </Button>
        <Button onClick={onNewReview} variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Nouvelle revue
        </Button>
        <Button onClick={onNewProject} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>
      <ProjectCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};
