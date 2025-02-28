
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
import { useCalendarImport } from '@/hooks/useCalendarImport';
import { CalendarEventSelection } from './CalendarEventSelection';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useToast } from '@/hooks/use-toast';
import { MicrosoftAuthStep } from './calendar-steps/MicrosoftAuthStep';
import { DateSelectionStep } from './calendar-steps/DateSelectionStep';

enum ImportStep {
  AUTH,
  DATE_SELECTION,
  EVENTS,
}

export const CalendarImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>(ImportStep.AUTH);
  const { isAuthenticated, checkAuthStatus } = useMicrosoftAuth();
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

  // Effet pour journaliser l'état du composant
  useEffect(() => {
    console.log("CalendarImport: step =", step, "isAuthenticated =", isAuthenticated);
  }, [step, isAuthenticated]);

  // Vérifier l'état d'authentification quand la boîte de dialogue s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Vérifier si l'utilisateur est déjà authentifié
      const authState = checkAuthStatus();
      console.log("Dialog opened, checking auth state:", authState);
      
      if (authState) {
        console.log("User is already authenticated, moving to DATE_SELECTION");
        setStep(ImportStep.DATE_SELECTION);
      } else {
        console.log("User is not authenticated, starting at AUTH step");
        setStep(ImportStep.AUTH);
      }
    } else {
      console.log("Dialog closed, resetting to AUTH step");
      setStep(ImportStep.AUTH);
    }
  }, [isOpen, checkAuthStatus]);

  // Gestion de la progression des étapes
  const handleAuthSuccess = () => {
    console.log("Auth success callback triggered, moving to date selection");
    setStep(ImportStep.DATE_SELECTION);
  };

  const handleDateSelection = (startDate: Date, endDate: Date) => {
    console.log("Date selection updated:", startDate, endDate);
    setImportDate(startDate);
    setEndDate(endDate);
  };

  const handleFetchEvents = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentification requise",
        description: "Vous devez vous connecter à Microsoft pour récupérer les événements.",
        variant: "destructive",
      });
      return;
    }
    
    if (!importDate || !endDate || importDate > endDate) {
      toast({
        title: "Dates invalides",
        description: "La date de début doit être antérieure ou égale à la date de fin.",
        variant: "destructive",
      });
      return;
    }

    console.log("Fetching events for dates:", importDate, endDate);
    fetchEvents(
      { 
        startDate: importDate, 
        endDate: endDate
      },
      {
        onSuccess: () => {
          console.log("Events fetched successfully, moving to EVENTS step");
          setStep(ImportStep.EVENTS);
          toast({
            title: "Événements récupérés",
            description: "Les événements ont été récupérés avec succès.",
          });
        },
        onError: (error) => {
          console.error("Error fetching events:", error);
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

    console.log("Importing selected events:", selectedEvents.length);
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
          console.error("Error importing events:", error);
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
    console.log("User cancelled, returning to AUTH step");
    setStep(ImportStep.AUTH);
  };

  // Rendu conditionnel basé sur l'étape actuelle
  const renderCurrentStep = () => {
    console.log("Rendering step:", step, 
      "isAuthenticated:", isAuthenticated ? "yes" : "no");
      
    switch (step) {
      case ImportStep.AUTH:
        return <MicrosoftAuthStep onAuthSuccess={handleAuthSuccess} />;
      
      case ImportStep.DATE_SELECTION:
        return (
          <DateSelectionStep
            onDateSelect={handleDateSelection}
            onFetchEvents={handleFetchEvents}
            importDate={importDate}
            endDate={endDate}
            isFetchingEvents={isFetchingEvents}
          />
        );
      
      case ImportStep.EVENTS:
        return (
          <CalendarEventSelection
            events={events}
            onImport={handleImport}
            onCancel={handleCancel}
            isLoading={isImporting}
            onToggleSelection={toggleEventSelection}
            onToggleAllEvents={toggleAllEvents}
            onEventChange={updateEventDetails}
          />
        );
      
      default:
        return <MicrosoftAuthStep onAuthSuccess={handleAuthSuccess} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log("Dialog open state changing to:", open);
      setIsOpen(open);
    }}>
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
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {renderCurrentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
