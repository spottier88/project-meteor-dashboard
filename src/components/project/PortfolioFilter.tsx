
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePortfolios } from "@/hooks/usePortfolios";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PortfolioFilterProps {
  selectedPortfolioId?: string;
  onPortfolioChange: (portfolioId: string | undefined) => void;
}

export const PortfolioFilter = ({ 
  selectedPortfolioId, 
  onPortfolioChange 
}: PortfolioFilterProps) => {
  // Récupérer l'utilisateur actuel
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: portfolios, isLoading } = usePortfolios(user?.id);

  const handlePortfolioChange = (value: string) => {
    if (value === "all") {
      onPortfolioChange(undefined);
    } else {
      onPortfolioChange(value);
    }
  };

  if (isLoading || !portfolios || portfolios.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="portfolio-filter">Filtrer par portefeuille</Label>
      <Select
        value={selectedPortfolioId || "all"}
        onValueChange={handlePortfolioChange}
      >
        <SelectTrigger id="portfolio-filter" className="w-[200px]">
          <SelectValue placeholder="Tous les portefeuilles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les portefeuilles</SelectItem>
          <SelectItem value="none">Sans portefeuille</SelectItem>
          {portfolios.map((portfolio) => (
            <SelectItem key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
