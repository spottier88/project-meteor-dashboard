/**
 * Composant de sélection multiple de portefeuilles
 * Permet d'affecter un projet à plusieurs portefeuilles
 */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, ChevronsUpDown, FolderKanban, Check } from "lucide-react";
import { useAccessiblePortfolios, AccessiblePortfolio } from "@/hooks/useAccessiblePortfolios";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const { data: portfolios, isLoading } = useAccessiblePortfolios();

  // Obtenir les détails des portefeuilles sélectionnés
  const selectedPortfolios = portfolios?.filter(p => selectedPortfolioIds.includes(p.id)) || [];

  const handleSelect = (portfolioId: string) => {
    if (selectedPortfolioIds.includes(portfolioId)) {
      // Retirer le portefeuille
      onChange(selectedPortfolioIds.filter(id => id !== portfolioId));
    } else {
      // Ajouter le portefeuille
      onChange([...selectedPortfolioIds, portfolioId]);
    }
  };

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

      {/* Sélecteur */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
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
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un portefeuille..." />
            <CommandList>
              <CommandEmpty>Aucun portefeuille trouvé.</CommandEmpty>
              <CommandGroup>
                {portfolios?.map(portfolio => {
                  const isSelected = selectedPortfolioIds.includes(portfolio.id);
                  return (
                    <CommandItem
                      key={portfolio.id}
                      value={portfolio.name}
                      onSelect={() => handleSelect(portfolio.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{portfolio.name}</span>
                      {portfolio.status && portfolio.status !== 'actif' && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({portfolio.status})
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
