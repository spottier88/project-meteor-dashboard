
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { BulkActivityEntry } from '@/types/activity';
import { BulkActivityTable } from './BulkActivityTable';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer';
import { TableIcon, Plus, Loader2, Save, AlertTriangle } from 'lucide-react';
import { useActivityTypes } from '@/hooks/useActivityTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export const BulkActivityEntryDrawer = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<BulkActivityEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialEntries, setInitialEntries] = useState<BulkActivityEntry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const session = useSession();
  const queryClient = useQueryClient();
  const { data: activityTypes, isLoading: isLoadingTypes } = useActivityTypes(true, true);

  // Récupérer la liste des projets
  const { data: projects } = useQuery({
    queryKey: ['accessible-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');

      if (error) throw error;
      return data;
    },
  });

  // Création d'une nouvelle ligne vide
  const createNewEntry = () => {
    return {
      id: uuidv4(),
      project_id: '', // Optionnel maintenant
      activity_type: '',
      description: '',
      duration_minutes: 60,
      start_time: new Date().toISOString().slice(0, 16),
      isValid: false
    };
  };

  // Initialiser avec une ligne vide à l'ouverture du drawer
  useEffect(() => {
    if (open) {
      const newEntries = [createNewEntry()];
      setEntries(newEntries);
      setInitialEntries(JSON.parse(JSON.stringify(newEntries)));
      setHasUnsavedChanges(false);
    }
  }, [open]);

  // Détecter les changements
  useEffect(() => {
    if (entries.length === 0 && initialEntries.length === 0) return;
    
    // Si le nombre d'entrées a changé, il y a des modifications
    if (entries.length !== initialEntries.length) {
      setHasUnsavedChanges(true);
      return;
    }
    
    // Vérifier si des entrées ont été modifiées
    const hasChanges = entries.some((entry, index) => {
      if (index >= initialEntries.length) return true;
      
      const initialEntry = initialEntries[index];
      return (
        entry.project_id !== initialEntry.project_id ||
        entry.activity_type !== initialEntry.activity_type ||
        entry.description !== initialEntry.description ||
        entry.duration_minutes !== initialEntry.duration_minutes ||
        entry.start_time !== initialEntry.start_time
      );
    });
    
    setHasUnsavedChanges(hasChanges);
  }, [entries, initialEntries]);

  // Mettre à jour une entrée
  const updateEntry = (id: string, field: string, value: any) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Ajouter une nouvelle ligne
  const addEntry = () => {
    setEntries(prev => [...prev, createNewEntry()]);
  };

  // Dupliquer une ligne
  const duplicateEntry = (id: string) => {
    const entryToDuplicate = entries.find(e => e.id === id);
    if (entryToDuplicate) {
      const newEntry = { 
        ...entryToDuplicate, 
        id: uuidv4(),
        description: `${entryToDuplicate.description} (copie)`
      };
      setEntries(prev => [...prev, newEntry]);
    }
  };

  // Supprimer une ligne
  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  // Mutation pour créer les activités
  const createActivitiesMutation = useMutation({
    mutationFn: async (activities: Omit<BulkActivityEntry, 'id' | 'isValid'>[]) => {
      const formattedActivities = activities.map(activity => ({
        ...activity,
        project_id: activity.project_id === 'aucun' || !activity.project_id ? null : activity.project_id,
        user_id: session?.user?.id
      }));

      const { data, error } = await supabase
        .from('activities')
        .insert(formattedActivities)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({
        title: 'Activités créées avec succès',
        description: `${entries.length} activité(s) ont été ajoutées.`
      });
      setHasUnsavedChanges(false);
      setOpen(false);
      setEntries([]);
    },
    onError: (error) => {
      console.error('Erreur lors de la création des activités:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer les activités. Veuillez réessayer.'
      });
    }
  });

  // Soumettre les activités
  const handleSubmit = async () => {
    if (entries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Aucune activité',
        description: 'Veuillez ajouter au moins une activité.'
      });
      return;
    }

    // Vérification des données obligatoires
    const allValid = entries.every(entry => 
      entry.activity_type && entry.description && 
      entry.duration_minutes > 0 && entry.start_time
    );

    if (!allValid) {
      toast({
        variant: 'destructive',
        title: 'Données incomplètes',
        description: 'Veuillez remplir tous les champs obligatoires.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createActivitiesMutation.mutateAsync(
        entries.map(({ id, isValid, ...rest }) => rest)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la demande de fermeture
  const handleOpenChange = (newOpenState: boolean) => {
    if (open && !newOpenState && hasUnsavedChanges && !isSubmitting) {
      setShowUnsavedChangesAlert(true);
      return;
    }
    setOpen(newOpenState);
  };

  // Fonctions pour gérer la confirmation ou l'annulation
  const handleConfirmClose = () => {
    setShowUnsavedChangesAlert(false);
    setHasUnsavedChanges(false);
    setOpen(false);
  };

  const handleCancelClose = () => {
    setShowUnsavedChangesAlert(false);
  };

  const noActivityTypesAvailable = !isLoadingTypes && (!activityTypes || activityTypes.length === 0);

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
            <DrawerTitle>Saisie en masse d'activités</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4">
            {noActivityTypesAvailable && (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Vous n'avez accès à aucun type d'activité. Veuillez contacter un administrateur.
                </AlertDescription>
              </Alert>
            )}
            
            <BulkActivityTable
              entries={entries}
              projects={projects || []}
              activityTypes={activityTypes || []}
              updateEntry={updateEntry}
              removeEntry={removeEntry}
              duplicateEntry={duplicateEntry}
            />
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={addEntry}
              disabled={noActivityTypesAvailable}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </div>
          <DrawerFooter>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || entries.length === 0 || noActivityTypesAvailable}
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
                    Enregistrer {entries.length} activité(s)
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter sans enregistrer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700">
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
