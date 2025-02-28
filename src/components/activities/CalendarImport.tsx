
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useCalendarImport } from '@/hooks/useCalendarImport';
import { CalendarEventSelection } from './CalendarEventSelection';
import { fr } from 'date-fns/locale';
import { MicrosoftAuthButton } from './MicrosoftAuthButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useToast } from '@/hooks/use-toast';

enum ImportStep {
  AUTH,
  EVENTS,
}

export const CalendarImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>(ImportStep.AUTH);
  const { isAuthenticated } = useMicrosoftAuth();
  const { toast } = useToast();
  
  const {
    importDate,
    setImportDate,
    endDate,
    setEndDate,
    events,
    fetchEvents,
    isFetchingEvents,
    importCalendar,
    isImporting,
    toggleEventSelection,
    toggleAllEvents,
    updateEventDetails,
  } = useCalendarImport();

  // Effet pour réinitialiser l'étape lors de la fermeture de la boîte de dialogue
  useEffect(() => {
    if (!isOpen) {
      setStep(ImportStep.AUTH);
    }
  }, [isOpen]);

  // Effet pour surveiller l'état d'authentification
  useEffect(() => {
    console.log("Authentication state changed in CalendarImport:", isAuthenticated);
    // Force a re-render when authentication state changes
    // No need to change step since we just want the UI to update
  }, [isAuthenticated]);

  // Validation des dates
  const areDatesValid = importDate && endDate && importDate <= endDate;

  const handleFetchEvents = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentification requise",
        description: "Vous devez vous connecter à Microsoft pour récupérer les événements.",
        variant: "destructive",
      });
      return;
    }
    
    if (!areDatesValid) {
      toast({
        title: "Dates invalides",
        description: "La date de début doit être antérieure ou égale à la date de fin.",
        variant: "destructive",
      });
      return;
    }

    fetchEvents(
      { 
        startDate: importDate!, 
        endDate: endDate!
      },
      {
        onSuccess: () => {
          setStep(ImportStep.EVENTS);
          toast({
            title: "Événements récupérés",
            description: "Les événements ont été récupérés avec succès.",
          });
        },
        onError: (error) => {
          toast({
            title: "Erreur",
            description: "Impossible de récupérer les événements: " + (error?.message || "Erreur inconnue"),
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleImport = (selectedEvents: any[]) => {
    if (selectedEvents.length === 0) {
      toast({
        title: "Sélection vide",
        description: "Veuillez sélectionner au moins un événement à importer.",
        variant: "destructive",
      });
      return;
    }

    importCalendar(
      { 
        startDate: importDate!,
        selectedEvents,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setStep(ImportStep.AUTH);
          toast({
            title: "Import réussi",
            description: `${selectedEvents.length} événement(s) importé(s) avec succès.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Erreur d'importation",
            description: "Impossible d'importer les événements: " + (error?.message || "Erreur inconnue"),
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleCancel = () => {
    setStep(ImportStep.AUTH);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setImportDate(date);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Importer du calendrier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importer depuis le calendrier</DialogTitle>
          <DialogDescription>
            Importez des événements depuis votre calendrier Microsoft.
            Connectez-vous et sélectionnez une période d'importation pour les événements.
          </DialogDescription>
        </DialogHeader>

        {step === ImportStep.AUTH ? (
          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <MicrosoftAuthButton />

              {isAuthenticated && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de début d'import</Label>
                      <CalendarComponent
                        mode="single"
                        selected={importDate}
                        onSelect={handleDateSelect}
                        locale={fr}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de fin d'import</Label>
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateSelect}
                        locale={fr}
                        disabled={(date) => date < (importDate || new Date())}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleFetchEvents}
                    disabled={isFetchingEvents || !areDatesValid}
                  >
                    {isFetchingEvents ? 'Chargement...' : 'Charger les événements'}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6">
            <CalendarEventSelection
              events={events}
              onImport={handleImport}
              onCancel={handleCancel}
              isLoading={isImporting}
              onToggleSelection={toggleEventSelection}
              onToggleAllEvents={toggleAllEvents}
              onEventChange={updateEventDetails}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
