
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { PortfolioForm } from "@/components/portfolio/PortfolioForm";
import { usePortfolios, useDeletePortfolio } from "@/hooks/usePortfolios";
import { PortfolioWithStats } from "@/types/portfolio";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const PortfolioManagement = () => {
  const { data: portfolios, isLoading, error } = usePortfolios();
  const deletePortfolio = useDeletePortfolio();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithStats | null>(null);
  const [portfolioToDelete, setPortfolioToDelete] = useState<string | null>(null);

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
    setPortfolioToDelete(id);
  };

  const confirmDelete = async () => {
    if (portfolioToDelete) {
      await deletePortfolio.mutateAsync(portfolioToDelete);
      setPortfolioToDelete(null);
    }
  };

  const handleView = (id: string) => {
    // TODO: Naviguer vers la page de détail du portefeuille
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des portefeuilles</h1>
          <p className="text-muted-foreground">
            Gérez vos portefeuilles de projets et suivez leur avancement
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0" variant="green">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau portefeuille
        </Button>
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
            {!searchTerm && statusFilter === "all" && (
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
            <PortfolioCard
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

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!portfolioToDelete} onOpenChange={() => setPortfolioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce portefeuille ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortfolioManagement;
