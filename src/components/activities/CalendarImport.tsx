
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
import { fr } from 'date-fns/locale';

export const CalendarImport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState('');
  const {
    importDate,
    setImportDate,
    importCalendar,
    isImporting,
  } = useCalendarImport();

  const handleImport = () => {
    if (!calendarUrl) return;
    
    importCalendar(
      { calendarUrl, startDate: importDate },
      {
        onSuccess: () => {
          setIsOpen(false);
          setCalendarUrl('');
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
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
              onSelect={(date) => date && setImportDate(date)}
              locale={fr}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleImport}
            disabled={!calendarUrl || isImporting}
          >
            {isImporting ? 'Importation...' : 'Importer'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
