
import React, { useEffect } from 'react';
import { MicrosoftAuthButton } from '../MicrosoftAuthButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { logger } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface MicrosoftAuthStepProps {
  onAuthSuccess: () => void;
}

export const MicrosoftAuthStep: React.FC<MicrosoftAuthStepProps> = ({ 
  onAuthSuccess 
}) => {
  const { isAuthenticated } = useMicrosoftAuth();

  // Effet pour journaliser l'état d'authentification
  useEffect(() => {
    logger.debug(`isAuthenticated = ${isAuthenticated}`, "auth");
    
    // Si déjà authentifié, on peut optionnellement passer automatiquement à l'étape suivante
    if (isAuthenticated) {
      logger.debug("Already authenticated, can proceed to next step", "auth");
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connectez-vous avec votre compte Microsoft pour accéder à votre calendrier.
        </p>
        <MicrosoftAuthButton onAuthSuccess={onAuthSuccess} />
      </div>

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
                      <span className="font-medium">Codes types d'activités</span> : Dans la section "Types d'activités", vous pouvez consulter la liste des codes disponibles.
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
    </div>
  );
};
