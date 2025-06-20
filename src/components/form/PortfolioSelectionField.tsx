
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePortfolios } from "@/hooks/usePortfolios";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PortfolioSelectionFieldProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  required?: boolean;
}

export const PortfolioSelectionField = ({ 
  value, 
  onChange, 
  required = false 
}: PortfolioSelectionFieldProps) => {
  // Récupérer l'utilisateur actuel
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: portfolios, isLoading } = usePortfolios(user?.id);

  return (
    <div className="space-y-2">
      <Label htmlFor="portfolio">
        Portefeuille {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={value || ""}
        onValueChange={(selectedValue) => onChange(selectedValue || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un portefeuille" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Aucun portefeuille</SelectItem>
          {isLoading ? (
            <SelectItem value="" disabled>
              Chargement...
            </SelectItem>
          ) : (
            portfolios?.map((portfolio) => (
              <SelectItem key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
