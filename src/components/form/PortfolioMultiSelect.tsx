/**
 * Composant de sélection multiple de portefeuilles
 * Permet d'affecter un projet à plusieurs portefeuilles
 * Utilise une modal pour éviter les problèmes d'interaction dans les dialogs imbriqués
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronsUpDown, FolderKanban } from "lucide-react";
import { useAccessiblePortfolios } from "@/hooks/useAccessiblePortfolios";
import { PortfolioMultiSelectDialog } from "./PortfolioMultiSelectDialog";

interface PortfolioMultiSelectProps {
  selectedPortfolioIds: string[];
  onChange: (portfolioIds: string[]) => void;
  disabled?: boolean;
}

export const PortfolioMultiSelect = ({
  selectedPortfolioIds,
  onChange,
  disabled = false
}: PortfolioMultiSelectProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: portfolios, isLoading } = useAccessiblePortfolios();

  // Obtenir les détails des portefeuilles sélectionnés
  const selectedPortfolios = portfolios?.filter(p => selectedPortfolioIds.includes(p.id)) || [];

  const handleRemove = (portfolioId: string) => {
    onChange(selectedPortfolioIds.filter(id => id !== portfolioId));
  };

  return (
    <div className="space-y-2">
      {/* Badges des portefeuilles sélectionnés */}
      {selectedPortfolios.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPortfolios.map(portfolio => (
            <Badge 
              key={portfolio.id} 
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <FolderKanban className="h-3 w-3" />
              <span>{portfolio.name}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(portfolio.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Bouton d'ouverture de la modal */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        disabled={disabled || isLoading}
        onClick={() => setIsDialogOpen(true)}
      >
        <span className="text-muted-foreground">
          {isLoading 
            ? "Chargement..." 
            : selectedPortfolioIds.length === 0 
              ? "Ajouter un portefeuille..." 
              : `${selectedPortfolioIds.length} portefeuille(s) sélectionné(s)`
          }
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Modal de sélection */}
      {portfolios && (
        <PortfolioMultiSelectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          selectedPortfolioIds={selectedPortfolioIds}
          onChange={onChange}
          portfolios={portfolios}
        />
      )}
    </div>
  );
};
