/**
 * Page unifiée de gestion des activités utilisateur
 * Regroupe : saisie de points (hebdo/quotidienne), import calendrier et dashboard
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Target, BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useToast } from "@/components/ui/use-toast";
import { useSession, useUser } from "@/contexts/AuthContext";
import { useWeeklyPoints, useWeeklyPointsTotal } from "@/hooks/useWeeklyPoints";
import { useActivityPointsQuota } from "@/hooks/useActivityPointsQuota";
import { useWeeklyPointsData } from "@/hooks/useWeeklyPointsData";
import { useWeeklyTrend, processWeeklyTrendData } from "@/hooks/useWeeklyTrend";
import { WeeklyPointsDistribution } from "./WeeklyPointsDistribution";
import { PointsEntryForm } from "./PointsEntryForm";
import { BulkPointsEntry } from "./BulkPointsEntry";
import { BulkPointEntry } from "./BulkPointsTable";
import { DailyPointsEntry } from "./DailyPointsEntry";
import { CalendarImport } from "./CalendarImport";
import { PointsVisualization } from "./PointsVisualization";
import { ActivityTypeDistributionChart } from "./ActivityTypeDistributionChart";
import { WeeklyTrendChart } from "./WeeklyTrendChart";
import { ProjectPointsChart } from "./ProjectPointsChart";
import { ActivityTypePointsChart } from "./ActivityTypePointsChart";
import { exportWeeklyPointsToExcel } from "@/utils/weeklyPointsExport";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export const ActivityManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, isTimeTracker } = usePermissionsContext();
  const { toast } = useToast();
  const session = useSession();
  const user = useUser();

  // Navigation semaine
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  // Saisie
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  // Dashboard filtres
  const [dashProjectId, setDashProjectId] = useState<string>('all');
  const [dashActivityType, setDashActivityType] = useState<string>('all');

  // Vérifier les droits d'accès
  if (!isAdmin && !isTimeTracker) {
    toast({
      title: "Accès refusé",
      description: "Vous n'avez pas les droits nécessaires pour accéder à cette page",
      variant: "destructive",
    });
    navigate('/');
    return null;
  }

  // Hooks de données
  const { quota } = useActivityPointsQuota();
  const {
    points, totalPointsUsed, isLoading, addPoints, addBulkPoints, deletePoints,
    isAddingPoints, isDeletingPoints,
  } = useWeeklyPoints(session?.user?.id || "", currentWeek);

  const pointsRemaining = Math.max(0, quota - totalPointsUsed);
  const quotaPercentage = quota > 0 ? Math.min(100, (totalPointsUsed / quota) * 100) : 0;

  // Données du dashboard
  const { data: dashPoints, isLoading: isLoadingDash } = useWeeklyPointsData({
    isTeamView: false,
    weekStartDate: currentWeek,
    projectId: dashProjectId,
    activityType: dashActivityType,
    selectedUserId: user?.id || ''
  });

  const { data: trendData } = useWeeklyTrend({
    isTeamView: false,
    weekStartDate: currentWeek,
    projectId: dashProjectId,
    activityType: dashActivityType,
    selectedUserId: '',
    weeksCount: 6
  });

  const trendChartData = processWeeklyTrendData(trendData || [], 6, currentWeek);

  // Projets et types d'activités pour les filtres
  const { data: projects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('projects')
        .select('id, title')
        .or(`project_manager_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('title');
      return data || [];
    },
    enabled: !!user
  });

  const { data: activityTypes } = useQuery({
    queryKey: ['activity-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    }
  });

  // Navigation semaine
  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleThisWeek = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekLabel = format(currentWeek, "'Semaine du' d MMMM yyyy", { locale: fr });

  // Ajout de points
  const handleAddPoints = (values: any) => {
    addPoints(
      {
        user_id: session?.user?.id || "",
        project_id: values.project_id || null,
        activity_type: values.activity_type || null,
        points: values.points,
        description: values.description || null,
        week_start_date: format(currentWeek, "yyyy-MM-dd"),
      },
      { onSuccess: () => setIsFormOpen(false) }
    );
  };

  const handleBulkSave = async (entries: BulkPointEntry[]) => {
    const pointsToInsert = entries.map(entry => ({
      user_id: session?.user?.id || "",
      project_id: entry.project_id,
      activity_type: entry.activity_type || null,
      points: entry.points,
      description: entry.description || null,
      week_start_date: format(currentWeek, "yyyy-MM-dd"),
    }));
    await addBulkPoints(pointsToInsert);
  };

  const handleConfirmDelete = () => {
    if (pointToDelete) {
      deletePoints(pointToDelete);
      setPointToDelete(null);
    }
  };

  const handleExportToExcel = () => {
    if (!dashPoints || dashPoints.length === 0) return;
    const userName = user ? `${user.email}` : undefined;
    exportWeeklyPointsToExcel(dashPoints, currentWeek, userName);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => void navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Mes activités</h1>
        </div>
      </div>

      {/* Navigation semaine + Barre quota */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleThisWeek} className="whitespace-nowrap">
                Semaine actuelle
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{weekLabel}</span>
          </div>

          {/* Barre de quota */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Quota hebdomadaire</span>
              <span className="text-muted-foreground">
                <PointsVisualization points={totalPointsUsed} size="sm" /> / {quota} points
                {pointsRemaining > 0 && (
                  <span className="ml-2 text-primary">({pointsRemaining} restants)</span>
                )}
              </span>
            </div>
            <Progress value={quotaPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Section saisie : toggle hebdo/quotidien + boutons d'action */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Saisie des points
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <CalendarImport />
              <BulkPointsEntry
                weekStartDate={currentWeek}
                quotaRemaining={pointsRemaining}
                onSuccess={() => {}}
                onBulkSave={handleBulkSave}
              />
              <Button onClick={() => setIsFormOpen(true)} disabled={pointsRemaining <= 0}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'weekly' | 'daily')}>
            <TabsList className="grid w-full max-w-xs grid-cols-2 mb-4">
              <TabsTrigger value="weekly">Semaine</TabsTrigger>
              <TabsTrigger value="daily">Jour</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Chargement...</p>
              ) : points.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun point distribué cette semaine. Cliquez sur "Ajouter" pour commencer.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projet</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {points.map((point: any) => (
                      <TableRow key={point.id}>
                        <TableCell>
                          {point.projects ? (
                            <span className="font-medium">{point.projects.title}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Aucun projet</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {point.activity_types ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: point.activity_types.color }} />
                              <Badge variant="secondary">{point.activity_types.label}</Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <PointsVisualization points={point.points} size="sm" />
                        </TableCell>
                        <TableCell>
                          {point.description || <span className="text-muted-foreground italic">-</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setPointToDelete(point.id)} disabled={isDeletingPoints}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="daily">
              <DailyPointsEntry weekStartDate={currentWeek} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Section Dashboard intégrée */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tableau de bord
            </CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={dashProjectId} onValueChange={setDashProjectId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dashActivityType} onValueChange={setDashActivityType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {activityTypes?.map(t => (
                    <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportToExcel} disabled={!dashPoints || dashPoints.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <WeeklyPointsDistribution totalPointsUsed={totalPointsUsed} weekStartDate={currentWeek} />

          {isLoadingDash ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : !dashPoints || dashPoints.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun point enregistré sur cette période
            </p>
          ) : (
            <div className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Répartition des points</h3>
                <ActivityTypeDistributionChart data={dashPoints} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Évolution sur 6 semaines</h3>
                <WeeklyTrendChart data={trendChartData} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Par type d'activité</h3>
                  <ActivityTypePointsChart points={dashPoints} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Par projet</h3>
                  <ProjectPointsChart points={dashPoints} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire modal d'ajout */}
      <PointsEntryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddPoints}
        isSubmitting={isAddingPoints}
        pointsRemaining={pointsRemaining}
        mode="weekly"
        dailyPointsUsed={0}
      />

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={!!pointToDelete} onOpenChange={(open) => !open && setPointToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ces points ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeletingPoints}>
              {isDeletingPoints ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
