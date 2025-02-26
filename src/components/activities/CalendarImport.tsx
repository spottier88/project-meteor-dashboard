
import React, { useState } from 'react';
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

enum ImportStep {
  AUTH,
  EVENTS,
}

export const CalendarImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>(ImportStep.AUTH);
  const { isAuthenticated } = useMicrosoftAuth();
  
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
  } = useCalendarImport();

  const handleFetchEvents = () => {
    if (!isAuthenticated) return;    
    fetchEvents(
      { 
        startDate: importDate, 
        endDate 
      },
      {
        onSuccess: () => {
          setStep(ImportStep.EVENTS);
        },
      }
    );
  };

  const handleImport = (selectedEvents: any[]) => {
    importCalendar(
      { 
        startDate: importDate,
        selectedEvents,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setStep(ImportStep.AUTH);
        },
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
                        disabled={(date) => date < importDate}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleFetchEvents}
                    disabled={isFetchingEvents || !importDate || !endDate}
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
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
