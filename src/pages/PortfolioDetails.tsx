import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Euro, Users, TrendingUp, Settings, ClipboardList } from "lucide-react";
import { usePortfolioDetails } from "@/hooks/usePortfolioDetails";
import { usePortfolioPermissions } from "@/hooks/usePortfolioPermissions";
import { PortfolioCharts } from "@/components/portfolio/PortfolioCharts";
import { PortfolioProjectsTable } from "@/components/portfolio/PortfolioProjectsTable";
import { PortfolioManagersTable } from "@/components/portfolio/PortfolioManagersTable";
import { PortfolioExportButtons } from "@/components/portfolio/PortfolioExportButtons";
import { PortfolioReviewsTab } from "@/components/portfolio/PortfolioReviewsTab";
import { AddProjectsModal } from "@/components/portfolio/AddProjectsModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PortfolioDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { canManagePortfolios } = usePortfolioPermissions();
  const [isAddProjectsModalOpen, setIsAddProjectsModalOpen] = useState(false);

  const { data: portfolio, isLoading, error } = usePortfolioDetails(id!);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              {error ? "Une erreur est survenue lors du chargement du portefeuille." : "Portefeuille non trouvé."}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "actif":
        return "bg-green-100 text-green-800";
      case "suspendu":
        return "bg-yellow-100 text-yellow-800";
      case "terminé":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Bouton de retour */}
      <div className="mb-6">
        <Link to="/portfolios">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Retour aux portefeuilles
          </Button>
        </Link>
      </div>

      {/* En-tête du portefeuille */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{portfolio.name}</h1>
              {portfolio.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(portfolio.status)}`}>
                  {portfolio.status}
                </span>
              )}
            </div>
            {portfolio.description && (
              <p className="text-muted-foreground text-lg">{portfolio.description}</p>
            )}
          </div>
          {/* Boutons d'export du portefeuille en haut */}
          <PortfolioExportButtons portfolioData={portfolio} />
        </div>

        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{portfolio.project_count}</div>
                  <div className="text-sm text-muted-foreground">Projets</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{portfolio.average_completion}%</div>
                  <div className="text-sm text-muted-foreground">Avancement</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {portfolio.budget_total && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Euro className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-lg font-bold">{formatCurrency(portfolio.budget_total)}</div>
                    <div className="text-sm text-muted-foreground">Budget total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(portfolio.start_date || portfolio.end_date) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div>
                    {portfolio.start_date && portfolio.end_date ? (
                      <>
                        <div className="text-sm font-medium">
                          {format(new Date(portfolio.start_date), "dd/MM/yyyy", { locale: fr })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          au {format(new Date(portfolio.end_date), "dd/MM/yyyy", { locale: fr })}
                        </div>
                      </>
                    ) : portfolio.start_date ? (
                      <>
                        <div className="text-sm font-medium">Début</div>
                        <div className="text-sm">
                          {format(new Date(portfolio.start_date), "dd/MM/yyyy", { locale: fr })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium">Fin prévue</div>
                        <div className="text-sm">
                          {format(new Date(portfolio.end_date!), "dd/MM/yyyy", { locale: fr })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
          </Card>
          )}
        </div>

        {/* Objectifs stratégiques */}
        {portfolio.strategic_objectives && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Objectifs stratégiques</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {portfolio.strategic_objectives}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className={`grid w-full ${canManagePortfolios ? "grid-cols-4" : "grid-cols-3"}`}>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <Users className="h-4 w-4" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Revues de projets
          </TabsTrigger>
          {canManagePortfolios && (
            <TabsTrigger value="managers" className="gap-2">
              <Settings className="h-4 w-4" />
              Gestionnaires
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-6">Vue d'ensemble</h2>
            <PortfolioCharts
              statusStats={portfolio.statusStats}
              lifecycleStats={portfolio.lifecycleStats}
              averageCompletion={portfolio.average_completion}
              projectCount={portfolio.project_count}
            />
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <PortfolioProjectsTable
            projects={portfolio.projects}
            portfolioId={portfolio.id}
            onAddProjects={() => setIsAddProjectsModalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <PortfolioReviewsTab
            portfolioId={portfolio.id}
            portfolioName={portfolio.name}
            projects={portfolio.projects}
          />
        </TabsContent>

        {canManagePortfolios && (
          <TabsContent value="managers" className="space-y-6">
            <PortfolioManagersTable
              portfolioId={portfolio.id}
              portfolioOwnerId={portfolio.created_by}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Modal d'ajout de projets */}
      {canManagePortfolios && (
        <AddProjectsModal
          isOpen={isAddProjectsModalOpen}
          onClose={() => setIsAddProjectsModalOpen(false)}
          portfolioId={portfolio.id}
          excludeProjectIds={portfolio.projects.map(p => p.id)}
        />
      )}
    </div>
  );
};

export default PortfolioDetails;
