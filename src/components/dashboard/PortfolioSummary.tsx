
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePortfolios } from "@/hooks/usePortfolios";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { FolderKanban, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const PortfolioSummary = () => {
  const navigate = useNavigate();
  const { isAdmin, hasRole } = usePermissionsContext();
  
  // Récupérer l'utilisateur actuel
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: portfolios, isLoading } = usePortfolios(user?.id);

  const canManagePortfolios = isAdmin || hasRole('portfolio_manager');

  if (!canManagePortfolios && (!portfolios || portfolios.length === 0)) {
    return null;
  }

  const activePortfolios = portfolios?.filter(p => p.status === 'actif') || [];
  const totalProjects = portfolios?.reduce((sum, p) => sum + (p.project_count || 0), 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <FolderKanban className="h-5 w-5" />
          Portefeuilles
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/portfolios")}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir tout
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Chargement...</div>
        ) : portfolios && portfolios.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{portfolios.length}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="font-medium">{activePortfolios.length}</div>
                <div className="text-muted-foreground">Actifs</div>
              </div>
            </div>
            
            {totalProjects > 0 && (
              <div className="text-sm">
                <div className="font-medium">{totalProjects}</div>
                <div className="text-muted-foreground">Projets au total</div>
              </div>
            )}

            {canManagePortfolios && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate("/portfolios")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau portefeuille
              </Button>
            )}
          </div>
        ) : canManagePortfolios ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Aucun portefeuille créé
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate("/portfolios")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un portefeuille
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Aucun portefeuille accessible
          </div>
        )}
      </CardContent>
    </Card>
  );
};
