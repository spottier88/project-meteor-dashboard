
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
import { logger } from '@/utils/logger';

enum ImportStep {
  AUTH,
  DATE_SELECTION,
  EVENTS,
}

export const CalendarImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>(ImportStep.AUTH);
  const { isAuthenticated, checkAuthStatus, setIsAuthenticated } = useMicrosoftAuth();
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
    logger.debug(`step = ${ImportStep[step]}, isAuthenticated = ${isAuthenticated ? "yes" : "no"}`, "calendar");
  }, [step, isAuthenticated]);

  // Vérifier l'état d'authentification quand la boîte de dialogue s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Vérifier si l'utilisateur est déjà authentifié
      const authState = checkAuthStatus();
      logger.debug(`Dialog opened, checking auth state: ${authState ? "authenticated" : "not authenticated"}`, "calendar");
      
      if (authState) {
        logger.debug("User is already authenticated, moving to DATE_SELECTION", "calendar");
        setIsAuthenticated(true); // S'assurer que l'état isAuthenticated est synchronisé
        setStep(ImportStep.DATE_SELECTION);
      } else {
        logger.debug("User is not authenticated, starting at AUTH step", "calendar");
        setIsAuthenticated(false); // S'assurer que l'état isAuthenticated est synchronisé
        setStep(ImportStep.AUTH);
      }
    } else {
      logger.debug("Dialog closed, resetting to AUTH step", "calendar");
      setStep(ImportStep.AUTH);
    }
  }, [isOpen, checkAuthStatus, setIsAuthenticated]);

  // Gestion de la progression des étapes
  const handleAuthSuccess = () => {
    logger.debug("Auth success callback triggered, moving to date selection", "calendar");
    setIsAuthenticated(true); // Mettre à jour l'état d'authentification
    setStep(ImportStep.DATE_SELECTION);
  };

  const handleDateSelection = (startDate: Date, endDate: Date) => {
    logger.debug(`Date selection updated: ${startDate.toISOString()}, ${endDate.toISOString()}`, "calendar");
    setImportDate(startDate);
    setEndDate(endDate);
  };

  const handleFetchEvents = () => {
    logger.debug("Fetch events requested", "calendar");
    const authState = checkAuthStatus();
    logger.debug(`Current auth state for fetch events: ${authState ? "authenticated" : "not authenticated"}`, "calendar");
    
    if (!authState) {
      logger.debug("Authentication required for fetch events", "calendar");
      setIsAuthenticated(false); // Synchroniser l'état en cas d'échec d'authentification
      toast({
        title: "Authentification requise",
        description: "Vous devez vous connecter à Microsoft pour récupérer les événements.",
        variant: "destructive",
      });
      setStep(ImportStep.AUTH); // Retour à l'étape d'authentification
      return;
    }
    
    if (!importDate || !endDate || importDate > endDate) {
      logger.debug("Invalid dates for fetch events", "calendar");
      toast({
        title: "Dates invalides",
        description: "La date de début doit être antérieure ou égale à la date de fin.",
        variant: "destructive",
      });
      return;
    }

    logger.debug(`Fetching events for dates: ${importDate.toISOString()}, ${endDate.toISOString()}`, "calendar");
    fetchEvents(
      { 
        startDate: importDate, 
        endDate: endDate
      },
      {
        onSuccess: () => {
          logger.debug("Events fetched successfully, moving to EVENTS step", "calendar");
          setStep(ImportStep.EVENTS);
          toast({
            title: "Événements récupérés",
            description: "Les événements ont été récupérés avec succès.",
          });
        },
        onError: (error) => {
          logger.error(`Error fetching events: ${error}`, "calendar");
          // Vérifier si l'erreur est liée à l'authentification
          if (error?.message?.includes("authenticated") || error?.message?.includes("token")) {
            logger.debug("Auth error detected, resetting auth state", "calendar");
            setIsAuthenticated(false); // Réinitialiser l'état d'authentification
            setStep(ImportStep.AUTH); // Retour à l'étape d'authentification
          }
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

    logger.debug(`Importing selected events: ${selectedEvents.length}`, "calendar");
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
          logger.error(`Error importing events: ${error}`, "calendar");
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
    logger.debug("User cancelled, returning to AUTH step", "calendar");
    setStep(ImportStep.AUTH);
  };

  // Rendu conditionnel basé sur l'étape actuelle
  const renderCurrentStep = () => {
    logger.debug(`Rendering step: ${ImportStep[step]}, isAuthenticated: ${isAuthenticated ? "yes" : "no"}`, "calendar");
      
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
            isAuthenticated={isAuthenticated}
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
      logger.debug(`Dialog open state changing to: ${open}`, "calendar");
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
