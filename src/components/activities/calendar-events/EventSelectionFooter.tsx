
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
  const eventsWithActivityTypeCodes = events.filter(event => event.activityTypeCode);
  
  const hasAutoDetectedProjectCodes = eventsWithProjectCodes.length > 0;
  const hasAutoDetectedActivityTypeCodes = eventsWithActivityTypeCodes.length > 0;
  
  const hasAnyAutoDetectedCodes = hasAutoDetectedProjectCodes || hasAutoDetectedActivityTypeCodes;

  return (
    <div className="space-y-4">
      {hasAnyAutoDetectedCodes && (
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                {hasAutoDetectedProjectCodes && (
                  <div>
                    <p className="text-sm font-medium">
                      {eventsWithProjectCodes.length} événement(s) avec des codes projet détectés
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Les codes projet au format #P-XXXX# ont été détectés dans la description de certains événements et les projets correspondants ont été automatiquement sélectionnés.
                    </p>
                  </div>
                )}
                
                {hasAutoDetectedActivityTypeCodes && (
                  <div>
                    <p className="text-sm font-medium">
                      {eventsWithActivityTypeCodes.length} événement(s) avec des codes de type d'activité détectés
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Les codes de type d'activité au format #A-XXX# ont été détectés dans la description de certains événements et les types d'activité correspondants ont été automatiquement sélectionnés.
                    </p>
                  </div>
                )}
                
                <div className="mt-2 border-t pt-2 border-slate-200">
                  <p className="text-xs font-semibold">Formats de codes reconnus :</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li><span className="font-mono">#P-XXXX#</span> pour associer l'événement à un projet</li>
                    <li><span className="font-mono">#A-XXX#</span> pour définir le type d'activité (où XXX est le code du type)</li>
                  </ul>
                </div>
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
