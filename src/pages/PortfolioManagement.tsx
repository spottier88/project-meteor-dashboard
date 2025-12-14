/**
 * @file PortfolioManagement.tsx
 * @description Page de gestion des portefeuilles avec permissions conditionnelles
 * Les actions sur chaque carte sont conditionnées par le rôle de l'utilisateur
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { PortfolioForm } from "@/components/portfolio/PortfolioForm";
import { usePortfolios, useDeletePortfolio } from "@/hooks/usePortfolios";
import { usePortfolioPermissions } from "@/hooks/usePortfolioPermissions";
import { usePortfolioRole } from "@/hooks/usePortfolioRole";
import { PortfolioWithStats } from "@/types/portfolio";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/**
 * Composant wrapper pour récupérer les permissions d'un portefeuille spécifique
 */
const PortfolioCardWithPermissions = ({
  portfolio,
  onEdit,
  onDelete,
  onView,
}: {
  portfolio: PortfolioWithStats;
  onEdit: (portfolio: PortfolioWithStats) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) => {
  const { canEdit, canDelete } = usePortfolioRole(portfolio.id);
  
  return (
    <PortfolioCard
      portfolio={portfolio}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
};

const PortfolioManagement = () => {
  const { data: portfolios, isLoading, error } = usePortfolios();
  const { canCreatePortfolio } = usePortfolioPermissions();
  const deletePortfolio = useDeletePortfolio();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithStats | null>(null);
  const [portfolioToDelete, setPortfolioToDelete] = useState<PortfolioWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrer les portefeuilles
  const filteredPortfolios = portfolios?.filter((portfolio) => {
    const matchesSearch = portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portfolio.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || portfolio.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (portfolio: PortfolioWithStats) => {
    setSelectedPortfolio(portfolio);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedPortfolio(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    // Trouver le portefeuille pour afficher ses infos dans la confirmation
    const portfolio = portfolios?.find(p => p.id === id);
    if (portfolio) {
      setPortfolioToDelete(portfolio);
    }
  };

  const confirmDelete = async () => {
    if (portfolioToDelete) {
      setIsDeleting(true);
      try {
        await deletePortfolio.mutateAsync(portfolioToDelete.id);
        setPortfolioToDelete(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleView = (id: string) => {
    // La navigation est gérée par le Link dans PortfolioCard
    console.log("Voir le portefeuille:", id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedPortfolio(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Une erreur est survenue lors du chargement des portefeuilles.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Bouton de retour à l'accueil */}
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des portefeuilles</h1>
          <p className="text-muted-foreground">
            Gérez vos portefeuilles de projets et suivez leur avancement
          </p>
        </div>
        {/* Bouton de création visible uniquement si l'utilisateur a le droit */}
        {canCreatePortfolio && (
          <Button onClick={handleCreate} className="shrink-0" variant="green">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau portefeuille
          </Button>
        )}
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un portefeuille..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="terminé">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des portefeuilles */}
      {!filteredPortfolios || filteredPortfolios.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Aucun portefeuille ne correspond à vos critères de recherche." 
                : "Aucun portefeuille créé pour le moment."}
            </div>
            {!searchTerm && statusFilter === "all" && canCreatePortfolio && (
              <Button onClick={handleCreate} className="mt-4" variant="green">
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier portefeuille
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortfolios.map((portfolio) => (
            <PortfolioCardWithPermissions
              key={portfolio.id}
              portfolio={portfolio}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* Formulaire de création/édition */}
      <PortfolioForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        portfolio={selectedPortfolio}
      />

      {/* Dialog de confirmation de suppression avec détails */}
      <AlertDialog open={!!portfolioToDelete} onOpenChange={() => !isDeleting && setPortfolioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Êtes-vous sûr de vouloir supprimer le portefeuille <strong>"{portfolioToDelete?.name}"</strong> ?
                </p>
                {portfolioToDelete && portfolioToDelete.project_count > 0 && (
                  <p className="text-amber-600 dark:text-amber-400">
                    ⚠️ Ce portefeuille contient {portfolioToDelete.project_count} projet(s) qui seront détachés.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Cette action supprimera également les gestionnaires associés et les revues de portefeuille. 
                  Les projets ne seront pas supprimés, seulement détachés du portefeuille.
                </p>
                <p className="text-destructive font-medium">
                  Cette action est irréversible.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortfolioManagement;
