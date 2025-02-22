
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useCalendarImport } from '@/hooks/useCalendarImport';
import { CalendarEventSelection } from './CalendarEventSelection';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

enum ImportStep {
  URL,
  EVENTS,
}

export const CalendarImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>(ImportStep.URL);
  const [calendarUrl, setCalendarUrl] = useState('');
  const { toast } = useToast();
  const {
    importDate,
    setImportDate,
    events,
    fetchEvents,
    isFetchingEvents,
    importCalendar,
    isImporting,
  } = useCalendarImport();

  const handleFetchEvents = () => {
    if (!calendarUrl) return;    
    fetchEvents(
      { calendarUrl, startDate: importDate },
      {
        onSuccess: () => {
          setStep(ImportStep.EVENTS);
        },
      }
    );
  };

  const handleImportEvents = (selectedEvents: any[]) => {
    importCalendar(
      { 
        calendarUrl, 
        startDate: importDate,
        selectedEvents,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setCalendarUrl('');
          setStep(ImportStep.URL);
        },
      }
    );
  };

  const handleCancel = () => {
    setStep(ImportStep.URL);
    setCalendarUrl('');
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setImportDate(date);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Importer du calendrier
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Importer depuis le calendrier</SheetTitle>
          <SheetDescription>
            Importez des événements depuis votre calendrier Outlook partagé.
            Seuls les événements à partir de la date sélectionnée seront importés.
          </SheetDescription>
        </SheetHeader>

        {step === ImportStep.URL ? (
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="calendar-url">URL du calendrier partagé</Label>
              <Input
                id="calendar-url"
                placeholder="https://outlook.office365.com/owa/calendar/..."
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de début d'import</Label>
              <CalendarComponent
                mode="single"
                selected={importDate}
                onSelect={handleDateSelect}
                locale={fr}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleFetchEvents}
              disabled={!calendarUrl || isFetchingEvents}
            >
              {isFetchingEvents ? 'Chargement...' : 'Charger les événements'}
            </Button>
          </div>
        ) : (
          <div className="py-6">
            <CalendarEventSelection
              events={events}
              onImport={handleImportEvents}
              onCancel={handleCancel}
              isLoading={isImporting}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
