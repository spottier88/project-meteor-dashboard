import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio } from "@/hooks/usePortfolios";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { PortfolioForm } from "@/components/portfolio/PortfolioForm";
import { PortfolioProjectsDialog } from "@/components/portfolio/PortfolioProjectsDialog";
import { PortfolioProjectManagementDialog } from "@/components/portfolio/PortfolioProjectManagementDialog";
import { Portfolio, CreatePortfolioData } from "@/types/portfolio";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PortfolioManagement() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [selectedPortfolioForView, setSelectedPortfolioForView] = useState<Portfolio | null>(null);
  const [selectedPortfolioForManagement, setSelectedPortfolioForManagement] = useState<Portfolio | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

  // Récupérer l'utilisateur actuel
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Vérifier les permissions de l'utilisateur
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data.map(r => r.role);
    },
    enabled: !!user?.id,
  });

  const { data: portfolios, isLoading } = usePortfolios(user?.id);
  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();

  const canCreatePortfolio = userRoles?.includes('admin') || userRoles?.includes('portfolio_manager');

  const handleCreatePortfolio = (data: CreatePortfolioData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  };

  const handleUpdatePortfolio = (data: CreatePortfolioData) => {
    if (!editingPortfolio) return;
    
    updateMutation.mutate({ id: editingPortfolio.id, ...data }, {
      onSuccess: () => {
        setShowForm(false);
        setEditingPortfolio(null);
      },
    });
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setShowForm(true);
  };

  const handleDelete = (portfolioId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce portefeuille ?")) {
      deleteMutation.mutate(portfolioId);
    }
  };

  const handleViewProjects = (portfolio: Portfolio) => {
    setSelectedPortfolioForView(portfolio);
    setShowProjects(true);
  };

  const handleManageProjects = (portfolio: Portfolio) => {
    setSelectedPortfolioForManagement(portfolio);
    setShowManagement(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPortfolio(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement des portefeuilles...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestion des Portefeuilles</h1>
            <p className="text-gray-600 mt-2">
              Gérez vos portefeuilles de projets et suivez leur avancement
            </p>
          </div>
        </div>
        
        {canCreatePortfolio && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Portefeuille
          </Button>
        )}
      </div>

      {!canCreatePortfolio && portfolios?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Vous n'avez accès à aucun portefeuille. Contactez un administrateur pour obtenir les permissions nécessaires.
          </p>
        </div>
      )}

      {portfolios && portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewProjects={handleViewProjects}
              onManageProjects={handleManageProjects}
              canManage={canCreatePortfolio}
            />
          ))}
        </div>
      ) : canCreatePortfolio && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            Aucun portefeuille créé pour le moment
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer votre premier portefeuille
          </Button>
        </div>
      )}

      <PortfolioForm
        open={showForm}
        onClose={handleCloseForm}
        onSubmit={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio}
        portfolio={editingPortfolio}
        isLoading={createMutation.isLoading || updateMutation.isLoading}
      />

      <PortfolioProjectsDialog
        open={showProjects}
        onClose={() => setShowProjects(false)}
        portfolio={selectedPortfolioForView}
      />

      <PortfolioProjectManagementDialog
        open={showManagement}
        onClose={() => setShowManagement(false)}
        portfolio={selectedPortfolioForManagement}
      />
    </div>
  );
}
