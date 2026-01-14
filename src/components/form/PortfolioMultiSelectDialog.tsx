/**
 * Composant modal de sélection multiple de portefeuilles
 * Permet d'affecter un projet à plusieurs portefeuilles via une modal
 * Remplace le Popover pour éviter les problèmes d'interaction dans les dialogs imbriqués
 */

import { useState, useMemo } from "react";
import { Check, Search, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccessiblePortfolio } from "@/hooks/useAccessiblePortfolios";

interface PortfolioMultiSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPortfolioIds: string[];
  onChange: (portfolioIds: string[]) => void;
  portfolios: AccessiblePortfolio[];
}

export const PortfolioMultiSelectDialog = ({
  isOpen,
  onClose,
  selectedPortfolioIds,
  onChange,
  portfolios,
}: PortfolioMultiSelectDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedPortfolioIds);

  // Réinitialiser la sélection et la recherche à l'ouverture
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempSelectedIds(selectedPortfolioIds);
      setSearchQuery("");
    } else {
      onClose();
    }
  };

  // Filtrer les portefeuilles selon la recherche
  const filteredPortfolios = useMemo(() => {
    if (!searchQuery.trim()) return portfolios;
    
    const query = searchQuery.toLowerCase();
    return portfolios.filter((portfolio) => {
      return portfolio.name.toLowerCase().includes(query);
    });
  }, [portfolios, searchQuery]);

  // Toggle la sélection d'un portefeuille
  const handleToggle = (portfolioId: string) => {
    if (tempSelectedIds.includes(portfolioId)) {
      setTempSelectedIds(tempSelectedIds.filter(id => id !== portfolioId));
    } else {
      setTempSelectedIds([...tempSelectedIds, portfolioId]);
    }
  };

  // Valider la sélection
  const handleValidate = () => {
    onChange(tempSelectedIds);
    onClose();
  };

  // Annuler et fermer
  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sélectionner les portefeuilles</DialogTitle>
        </DialogHeader>

        {/* Champ de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un portefeuille..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Compteur de sélection */}
        {tempSelectedIds.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {tempSelectedIds.length} portefeuille(s) sélectionné(s)
          </div>
        )}

        {/* Liste des portefeuilles */}
        <ScrollArea className="h-64 rounded-md border">
          <div className="p-2">
            {filteredPortfolios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FolderKanban className="h-8 w-8 mb-2" />
                <p className="text-sm">Aucun portefeuille trouvé</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPortfolios.map((portfolio) => {
                  const isSelected = tempSelectedIds.includes(portfolio.id);
                  return (
                    <button
                      key={portfolio.id}
                      type="button"
                      onClick={() => handleToggle(portfolio.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
                          {portfolio.name}
                        </span>
                        {portfolio.status && portfolio.status !== 'actif' && (
                          <span className="text-xs text-muted-foreground">
                            {portfolio.status}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button type="button" onClick={handleValidate}>
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
