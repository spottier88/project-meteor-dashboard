
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { ActivityTypeCodesDialog } from './ActivityTypeCodesDialog';

interface DateSelectionStepProps {
  onDateSelect: (startDate: Date, endDate: Date) => void;
  onFetchEvents: () => void;
  importDate: Date | undefined;
  endDate: Date | undefined;
  isFetchingEvents: boolean;
  isAuthenticated: boolean;
}

export const DateSelectionStep: React.FC<DateSelectionStepProps> = ({
  onDateSelect,
  onFetchEvents,
  importDate,
  endDate,
  isFetchingEvents,
  isAuthenticated
}) => {
  // Effet pour journaliser l'état d'authentification
  useEffect(() => {
    console.log("DateSelectionStep: isAuthenticated =", isAuthenticated);
  }, [isAuthenticated]);
  
  // État local pour la validation
  const areDatesValid = importDate && endDate && importDate <= endDate;
  const canFetchEvents = areDatesValid && isAuthenticated && !isFetchingEvents;

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log("DateSelectionStep: Selected start date:", date);
      onDateSelect(date, endDate || date);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log("DateSelectionStep: Selected end date:", date);
      onDateSelect(importDate || date, date);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-2">
        Sélectionnez la période pour laquelle vous souhaitez importer des événements.
      </p>
       {/* Nouvelle section de documentation pour les codes */}
      <Card className="bg-muted/40">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-3">
              <p className="text-sm font-medium">Comment utiliser les codes dans vos événements de calendrier</p>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Vous pouvez ajouter des codes spéciaux dans la description de vos événements pour les associer automatiquement à des projets et types d'activités lors de l'import.
                </p>
                
                <div className="space-y-1 mt-2">
                  <p className="text-xs font-semibold">Formats de codes reconnus :</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>
                      <span className="font-mono">#P-XXXX#</span> - pour associer automatiquement l'événement à un projet 
                      <span className="text-xs text-slate-500"> (l'événement sera également présélectionné)</span>
                    </li>
                    <li>
                      <span className="font-mono">#A-XXX#</span> - pour définir le type d'activité
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-1 mt-3">
                  <p className="text-xs font-semibold">Où trouver les codes disponibles :</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>
                      <span className="font-medium">Codes projets</span> : Sur la page de détail de chaque projet, vous pouvez voir et copier le code du projet.
                    </li>
                    <li>
                      <span className="font-medium">Codes types d'activités</span> : <ActivityTypeCodesDialog />
                    </li>
                  </ul>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-slate-500 italic">
                    Exemple : Description d'un événement avec <span className="font-mono">#P-PROJ#</span> et <span className="font-mono">#A-DEV#</span> sera associé au projet "PROJ" avec le type d'activité "DEV".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
      
      {!isAuthenticated && (
        <div className="text-sm text-amber-600 mb-2">
          Vous devez vous connecter à Microsoft pour récupérer les événements.
        </div>
      )}
      
      <Button 
        className="w-full" 
        onClick={onFetchEvents}
        disabled={!canFetchEvents}
      >
        {isFetchingEvents ? 'Chargement...' : 'Charger les événements'}
      </Button>
      {!canFetchEvents && (
        <div className="text-xs text-muted-foreground mt-1">
          {!areDatesValid && "Veuillez sélectionner des dates valides. "}
          {!isAuthenticated && "Authentification Microsoft requise. "}
          {isFetchingEvents && "Chargement en cours..."}
        </div>
      )}
    </div>
  );
};
