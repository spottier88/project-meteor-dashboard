import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface DashboardHeaderProps {
  onNewReview: () => void;
}

export const DashboardHeader = ({ onNewReview }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord des Projets</h1>
        <p className="text-muted-foreground">
          Suivez et évaluez l'état et la progression de vos projets
        </p>
      </div>
      <Button
        onClick={onNewReview}
        className="w-full md:w-auto animate-fade-in"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Nouvelle Revue
      </Button>
    </div>
  );
};