import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TableIcon, Loader2, Save, Search, X } from "lucide-react";
import { useUserProjects } from "@/hooks/useUserProjects";
import { useActivityTypes } from "@/hooks/useActivityTypes";
import { BulkPointsTable, BulkPointEntry } from "./BulkPointsTable";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface BulkPointsEntryProps {
  weekStartDate: Date;
  quotaRemaining: number;
  onSuccess: () => void;
  onBulkSave: (entries: BulkPointEntry[]) => Promise<void>;
}

/**
 * Composant Drawer pour la saisie en masse de points sur les projets
 */
export const BulkPointsEntry: React.FC<BulkPointsEntryProps> = ({
  weekStartDate,
  quotaRemaining,
  onSuccess,
  onBulkSave,
}) => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<BulkPointEntry[]>([]);
  const [initialEntries, setInitialEntries] = useState<BulkPointEntry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPole, setSelectedPole] = useState<string>("all");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");

  const { toast } = useToast();
  const { data: projects, isLoading: isLoadingProjects } = useUserProjects();
  const { data: activityTypes, isLoading: isLoadingTypes } = useActivityTypes(true, true);

  // Extraire les entités uniques pour les filtres
  const poles = useMemo(() => {
    if (!projects) return [];
    const uniquePoles = new Map();
    projects.forEach((p: any) => {
      if (p.pole_id && p.pole_name) {
        uniquePoles.set(p.pole_id, p.pole_name);
      }
    });
    return Array.from(uniquePoles.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const directions = useMemo(() => {
    if (!projects) return [];
    const uniqueDirections = new Map();
    projects.forEach((p: any) => {
      if (p.direction_id && p.direction_name) {
        uniqueDirections.set(p.direction_id, p.direction_name);
      }
    });
    return Array.from(uniqueDirections.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const services = useMemo(() => {
    if (!projects) return [];
    const uniqueServices = new Map();
    projects.forEach((p: any) => {
      if (p.service_id && p.service_name) {
        uniqueServices.set(p.service_id, p.service_name);
      }
    });
    return Array.from(uniqueServices.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  // Filtrer les projets
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter((project: any) => {
      // Filtre par recherche
      if (searchTerm && !project.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par pôle
      if (selectedPole !== "all" && project.pole_id !== selectedPole) {
        return false;
      }

      // Filtre par direction
      if (selectedDirection !== "all" && project.direction_id !== selectedDirection) {
        return false;
      }

      // Filtre par service
      if (selectedService !== "all" && project.service_id !== selectedService) {
        return false;
      }

      return true;
    });
  }, [projects, searchTerm, selectedPole, selectedDirection, selectedService]);

  // Initialiser les entrées à l'ouverture
  useEffect(() => {
    if (open && filteredProjects) {
      const newEntries: BulkPointEntry[] = filteredProjects.map((project: any) => ({
        id: project.id,
        project_id: project.id,
        project_title: project.title,
        points: 0,
        pole_name: project.pole_name,
        direction_name: project.direction_name,
        service_name: project.service_name,
      }));
      setEntries(newEntries);
      setInitialEntries(JSON.parse(JSON.stringify(newEntries)));
      setHasUnsavedChanges(false);
    }
  }, [open, filteredProjects]);

  // Détecter les changements
  useEffect(() => {
    if (entries.length === 0 && initialEntries.length === 0) return;

    const hasChanges = entries.some((entry, index) => {
      if (index >= initialEntries.length) return true;
      const initialEntry = initialEntries[index];
      return (
        entry.points !== initialEntry.points ||
        entry.activity_type !== initialEntry.activity_type ||
        entry.description !== initialEntry.description
      );
    });

    setHasUnsavedChanges(hasChanges);
  }, [entries, initialEntries]);

  // Mettre à jour une entrée
  const updateEntry = (id: string, field: string, value: any) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedPole("all");
    setSelectedDirection("all");
    setSelectedService("all");
  };

  // Préparer le récapitulatif
  const summary = useMemo(() => {
    const validEntries = entries.filter((e) => e.points > 0);
    const totalPoints = validEntries.reduce((sum, e) => sum + e.points, 0);
    return { validEntries, totalPoints };
  }, [entries]);

  // Gérer la validation
  const handleSubmit = () => {
    if (summary.validEntries.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun point saisi",
        description: "Veuillez saisir au moins 1 point sur un projet.",
      });
      return;
    }

    if (summary.totalPoints > quotaRemaining) {
      toast({
        variant: "destructive",
        title: "Quota dépassé",
        description: `Vous dépassez le quota de ${quotaRemaining} points restants.`,
      });
      return;
    }

    // Afficher le récapitulatif
    setShowSummaryDialog(true);
  };

  // Confirmer et enregistrer
  const handleConfirmSave = async () => {
    setShowSummaryDialog(false);
    setIsSubmitting(true);

    try {
      await onBulkSave(summary.validEntries);
      toast({
        title: "Points enregistrés",
        description: `${summary.validEntries.length} projet(s) avec ${summary.totalPoints} points ajoutés.`,
      });
      setHasUnsavedChanges(false);
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer les points.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la fermeture
  const handleOpenChange = (newOpenState: boolean) => {
    if (open && !newOpenState && hasUnsavedChanges && !isSubmitting) {
      setShowUnsavedChangesAlert(true);
      return;
    }
    setOpen(newOpenState);
    if (!newOpenState) {
      resetFilters();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedChangesAlert(false);
    setHasUnsavedChanges(false);
    setOpen(false);
    resetFilters();
  };

  const isLoading = isLoadingProjects || isLoadingTypes;

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <TableIcon className="h-4 w-4 mr-2" />
            Saisie en masse
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Saisie en masse de points hebdomadaires</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            {/* Filtres */}
            <div className="space-y-3 p-4 rounded-md border bg-muted/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Filtres</Label>
                {(searchTerm || selectedPole !== "all" || selectedDirection !== "all" || selectedService !== "all") && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un projet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Pôle */}
                <Select value={selectedPole} onValueChange={setSelectedPole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pôles</SelectItem>
                    {poles.map((pole: any) => (
                      <SelectItem key={pole.id} value={pole.id}>
                        {pole.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Direction */}
                <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les directions</SelectItem>
                    {directions.map((direction: any) => (
                      <SelectItem key={direction.id} value={direction.id}>
                        {direction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Service */}
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    {services.map((service: any) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">
                {filteredProjects.length} projet(s) affiché(s)
              </div>
            </div>

            {/* Tableau */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des projets...
              </div>
            ) : (
              <BulkPointsTable
                entries={entries}
                activityTypes={activityTypes || []}
                updateEntry={updateEntry}
                quotaRemaining={quotaRemaining}
              />
            )}
          </div>

          <DrawerFooter>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || summary.validEntries.length === 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer {summary.validEntries.length} projet(s)
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Alert modifications non enregistrées */}
      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter sans
              enregistrer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedChangesAlert(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-red-600 hover:bg-red-700"
            >
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Récapitulatif avant validation */}
      <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Récapitulatif de la saisie</AlertDialogTitle>
            <AlertDialogDescription>
              Vérifiez les points avant de les enregistrer
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {summary.validEntries.map((entry) => (
              <div key={entry.id} className="flex justify-between items-start p-3 rounded-md border">
                <div className="flex-1">
                  <div className="font-medium">{entry.project_title}</div>
                  {entry.activity_type && (
                    <div className="text-sm text-muted-foreground">
                      Type :{" "}
                      {activityTypes?.find((t) => t.code === entry.activity_type)?.label ||
                        entry.activity_type}
                    </div>
                  )}
                  {entry.description && (
                    <div className="text-sm text-muted-foreground">{entry.description}</div>
                  )}
                </div>
                <Badge variant="secondary" className="ml-2">
                  {entry.points} pts
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center p-4 rounded-md border bg-muted">
            <span className="font-medium">Total</span>
            <Badge variant="default" className="text-base px-3 py-1">
              {summary.totalPoints} points
            </Badge>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Confirmer et enregistrer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
