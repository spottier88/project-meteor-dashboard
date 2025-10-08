import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "@supabase/auth-helpers-react";
import { useWeeklyPoints } from "@/hooks/useWeeklyPoints";
import { useActivityPointsQuota } from "@/hooks/useActivityPointsQuota";
import { WeeklyPointsDistribution } from "./WeeklyPointsDistribution";
import { PointsEntryForm } from "./PointsEntryForm";
import { BulkPointsEntry } from "./BulkPointsEntry";
import { BulkPointEntry } from "./BulkPointsTable";
import { Badge } from "@/components/ui/badge";
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Composant principal pour la saisie des points hebdomadaires
 * Permet de distribuer des points sur les projets par semaine
 */
export const WeeklyPointsEntry: React.FC = () => {
  const session = useSession();
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<string | null>(null);

  const { quota } = useActivityPointsQuota();
  const {
    points,
    totalPointsUsed,
    isLoading,
    addPoints,
    addBulkPoints,
    deletePoints,
    isAddingPoints,
    isDeletingPoints,
  } = useWeeklyPoints(session?.user?.id || "", currentWeek);

  const pointsRemaining = Math.max(0, quota - totalPointsUsed);

  // Navigation entre les semaines
  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleThisWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Gestion de l'ajout de points via formulaire modal
  const handleAddPoints = (values: any) => {
    addPoints({
      user_id: session?.user?.id || "",
      project_id: values.project_id || null,
      activity_type: values.activity_type || null,
      points: values.points,
      description: values.description || null,
      week_start_date: format(currentWeek, "yyyy-MM-dd"),
    });
    setIsFormOpen(false);
  };


  // Gestion de l'ajout en masse de points
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

  // Gestion de la suppression
  const handleConfirmDelete = () => {
    if (pointToDelete) {
      deletePoints(pointToDelete);
      setPointToDelete(null);
    }
  };

  // Formatage de la période
  const weekLabel = format(currentWeek, "'Semaine du' d MMMM yyyy", { locale: fr });

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Distribution des points hebdomadaires</CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleThisWeek}
                className="whitespace-nowrap"
              >
                Semaine actuelle
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </CardHeader>
      </Card>

      {/* Vue d'ensemble de la distribution */}
      <WeeklyPointsDistribution
        totalPointsUsed={totalPointsUsed}
        weekStartDate={currentWeek}
      />

      {/* Liste des points distribués */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Points distribués</CardTitle>
            <div className="flex gap-2">
              <BulkPointsEntry
                weekStartDate={currentWeek}
                quotaRemaining={pointsRemaining}
                onSuccess={() => {
                  // Les données seront rafraîchies automatiquement via invalidateQueries
                }}
                onBulkSave={handleBulkSave}
              />
              <Button
                onClick={() => setIsFormOpen(true)}
                disabled={pointsRemaining <= 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des points
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">
              Chargement...
            </p>
          ) : points.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun point distribué cette semaine. Cliquez sur "Ajouter des points" pour commencer.
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
                        <span className="font-medium">
                          {point.projects.title}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Aucun projet
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {point.activity_types ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: point.activity_types.color }}
                          />
                          <Badge variant="secondary">{point.activity_types.label}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge>{point.points} pts</Badge>
                    </TableCell>
                    <TableCell>
                      {point.description || (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPointToDelete(point.id)}
                        disabled={isDeletingPoints}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'ajout */}
      <PointsEntryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddPoints}
        isSubmitting={isAddingPoints}
        pointsRemaining={pointsRemaining}
      />

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog
        open={!!pointToDelete}
        onOpenChange={(open) => !open && setPointToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ces points ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeletingPoints}
            >
              {isDeletingPoints ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
