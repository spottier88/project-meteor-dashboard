/**
 * @page EvaluationsManagement
 * @description Page de gestion et consultation transversale des évaluations de projets clôturés.
 * Accessible aux administrateurs et aux responsables qualité (quality_manager).
 * Permet de visualiser, filtrer et exporter toutes les évaluations de méthode projet.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { supabase } from "@/integrations/supabase/client";
import { useAllEvaluations, EvaluationFilters, EvaluationWithProject } from "@/hooks/useAllEvaluations";
import { exportEvaluationsToExcel } from "@/utils/evaluationsExport";
import { EvaluationDetailsDialog } from "@/components/evaluations/EvaluationDetailsDialog";
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Eye, 
  ClipboardCheck,
  Building2,
  Filter,
  X,
  FileSpreadsheet
} from "lucide-react";
import { formatUserName } from "@/utils/formatUserName";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const EvaluationsManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, isQualityManager } = usePermissionsContext();
  
  // États pour les filtres
  const [filters, setFilters] = useState<EvaluationFilters>({});
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithProject | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Vérification des permissions
  const canAccess = isAdmin || isQualityManager;

  // Récupération des pôles pour le filtre
  const { data: poles } = useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: canAccess,
  });

  // Récupération des directions pour le filtre
  const { data: directions } = useQuery({
    queryKey: ["directions", filters.poleId],
    queryFn: async () => {
      let query = supabase.from("directions").select("id, name, pole_id").order("name");
      if (filters.poleId) {
        query = query.eq("pole_id", filters.poleId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: canAccess,
  });

  // Récupération des services pour le filtre
  const { data: services } = useQuery({
    queryKey: ["services", filters.directionId],
    queryFn: async () => {
      let query = supabase.from("services").select("id, name, direction_id").order("name");
      if (filters.directionId) {
        query = query.eq("direction_id", filters.directionId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: canAccess,
  });

  // Récupération des profils pour afficher les noms des chefs de projet
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name");
      if (error) throw error;
      return data;
    },
    enabled: canAccess,
  });

  // Récupération des évaluations avec filtres
  const { data: evaluations, isLoading, error } = useAllEvaluations(filters);

  // Redirection si pas de permission
  if (!canAccess) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les administrateurs et les responsables qualité peuvent consulter les évaluations.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => void navigate("/")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  // Mise à jour des filtres
  const handleFilterChange = (key: keyof EvaluationFilters, value: string | undefined) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value || undefined };
      
      // Reset des filtres dépendants
      if (key === "poleId") {
        newFilters.directionId = undefined;
        newFilters.serviceId = undefined;
      }
      if (key === "directionId") {
        newFilters.serviceId = undefined;
      }
      
      return newFilters;
    });
  };

  // Reset des filtres
  const handleClearFilters = () => {
    setFilters({});
  };

  // Export Excel
  const handleExport = () => {
    if (evaluations && evaluations.length > 0) {
      exportEvaluationsToExcel(evaluations);
    }
  };

  // Ouverture des détails
  const handleViewDetails = (evaluation: EvaluationWithProject) => {
    setSelectedEvaluation(evaluation);
    setIsDetailsOpen(true);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "");

  return (
    <div className="container mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => void navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-8 w-8" />
              Retours d'Expérience
            </h1>
            <p className="text-muted-foreground mt-1">
              Consultez et analysez les évaluations de méthode projet des projets clôturés
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={!evaluations || evaluations.length === 0}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des évaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : evaluations?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avec leçons apprises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                evaluations?.filter(e => e.lessons_learned).length || 0
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avec améliorations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                evaluations?.filter(e => e.improvements).length || 0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Effacer les filtres
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche textuelle */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtre Pôle */}
            <Select
              value={filters.poleId || "all"}
              onValueChange={(value) => handleFilterChange("poleId", value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les pôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pôles</SelectItem>
                {poles?.map((pole) => (
                  <SelectItem key={pole.id} value={pole.id}>
                    {pole.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre Direction */}
            <Select
              value={filters.directionId || "all"}
              onValueChange={(value) => handleFilterChange("directionId", value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions?.map((direction) => (
                  <SelectItem key={direction.id} value={direction.id}>
                    {direction.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre Date début */}
            <Input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              placeholder="Date début"
            />

            {/* Filtre Date fin */}
            <Input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              placeholder="Date fin"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tableau des évaluations */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="m-6">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Impossible de charger les évaluations. Veuillez réessayer.
              </AlertDescription>
            </Alert>
          ) : evaluations && evaluations.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune évaluation trouvée</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Aucune évaluation ne correspond aux filtres sélectionnés."
                  : "Aucun projet n'a encore été clôturé avec une évaluation."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Chef de projet</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Date de clôture</TableHead>
                  <TableHead>Contenu</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations?.map((evaluation) => {
                  // Construction de l'organisation
                  const orgParts = [];
                  if (evaluation.project?.pole?.name) orgParts.push(evaluation.project.pole.name);
                  if (evaluation.project?.direction?.name) orgParts.push(evaluation.project.direction.name);

                  // Indicateurs de contenu
                  const hasContent = {
                    worked: !!evaluation.what_worked,
                    missing: !!evaluation.what_was_missing,
                    improvements: !!evaluation.improvements,
                    lessons: !!evaluation.lessons_learned,
                  };

                  return (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <Link
                          to={`/projects/${evaluation.project_id}`}
                          className="font-medium hover:underline text-primary"
                        >
                          {evaluation.project?.title || "Projet inconnu"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatUserName(evaluation.project?.project_manager ?? undefined, profiles)}
                      </TableCell>
                      <TableCell>
                        {orgParts.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {orgParts.join(" > ")}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {evaluation.project?.closed_at
                          ? new Date(evaluation.project.closed_at).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {hasContent.worked && (
                            <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                              ✓
                            </Badge>
                          )}
                          {hasContent.missing && (
                            <Badge variant="outline" className="text-red-500 border-red-300 text-xs">
                              ✗
                            </Badge>
                          )}
                          {hasContent.improvements && (
                            <Badge variant="outline" className="text-amber-500 border-amber-300 text-xs">
                              💡
                            </Badge>
                          )}
                          {hasContent.lessons && (
                            <Badge variant="outline" className="text-blue-500 border-blue-300 text-xs">
                              📖
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(evaluation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de détails */}
      <EvaluationDetailsDialog
        evaluation={selectedEvaluation}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
};

export default EvaluationsManagement;
