
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';

interface DateSelectionStepProps {
  onDateSelect: (startDate: Date, endDate: Date) => void;
  onFetchEvents: () => void;
  importDate: Date | undefined;
  endDate: Date | undefined;
  isFetchingEvents: boolean;
}

export const DateSelectionStep: React.FC<DateSelectionStepProps> = ({
  onDateSelect,
  onFetchEvents,
  importDate,
  endDate,
  isFetchingEvents
}) => {
  // État local pour la validation
  const areDatesValid = importDate && endDate && importDate <= endDate;

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date, endDate || date);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(importDate || date, date);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-2">
        Sélectionnez la période pour laquelle vous souhaitez importer des événements.
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début d'import</Label>
          <Calendar
            mode="single"
            selected={importDate}
            onSelect={handleStartDateSelect}
            locale={fr}
          />
        </div>
        <div className="space-y-2">
          <Label>Date de fin d'import</Label>
          <Calendar
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
        onClick={onFetchEvents}
        disabled={isFetchingEvents || !areDatesValid}
      >
        {isFetchingEvents ? 'Chargement...' : 'Charger les événements'}
      </Button>
    </div>
  );
};
