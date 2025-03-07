
import React, { useEffect } from 'react';
import { MicrosoftAuthButton } from '../MicrosoftAuthButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { logger } from '@/utils/logger';

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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connectez-vous avec votre compte Microsoft pour accéder à votre calendrier.
      </p>
      <MicrosoftAuthButton onAuthSuccess={onAuthSuccess} />
    </div>
  );
};
