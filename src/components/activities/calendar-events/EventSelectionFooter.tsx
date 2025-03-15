
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/activity';
import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  events
}) => {
  const eventsWithProjectCodes = events.filter(event => event.projectCode);
  const hasAutoDetectedCodes = eventsWithProjectCodes.length > 0;

  return (
    <div className="space-y-4">
      {hasAutoDetectedCodes && (
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {eventsWithProjectCodes.length} événement(s) avec des codes projet détectés
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les codes projet au format #P-XXXX# ont été détectés dans la description de certains événements et les projets correspondants ont été automatiquement sélectionnés.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm font-medium">{selectedCount} événement(s) sélectionné(s)</span>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button 
            onClick={() => onImport(events)} 
            disabled={!canImport || isLoading || selectedCount === 0}
          >
            {isLoading ? 'Importation...' : 'Importer les événements'}
          </Button>
        </div>
      </div>
    </div>
  );
};
