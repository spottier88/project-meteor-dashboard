
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/activity';

interface EventSelectionFooterProps {
  selectedCount: number;
  canImport: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onImport: (events: CalendarEvent[]) => void;
  events: CalendarEvent[];
}

export const EventSelectionFooter: React.FC<EventSelectionFooterProps> = ({
  selectedCount,
  canImport,
  isLoading,
  onCancel,
  onImport,
  events,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-sm text-muted-foreground">
        {selectedCount} événement{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          onClick={() => onImport(events)}
          disabled={!canImport || isLoading || selectedCount === 0}
        >
          {isLoading ? 'Importation...' : `Importer ${selectedCount} événement${selectedCount > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};
