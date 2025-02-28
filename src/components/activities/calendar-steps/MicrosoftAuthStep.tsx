
import React, { useEffect } from 'react';
import { MicrosoftAuthButton } from '../MicrosoftAuthButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

interface MicrosoftAuthStepProps {
  onAuthSuccess: () => void;
}

export const MicrosoftAuthStep: React.FC<MicrosoftAuthStepProps> = ({ 
  onAuthSuccess 
}) => {
  const { isAuthenticated } = useMicrosoftAuth();

  // Effet pour journaliser l'état d'authentification
  useEffect(() => {
    console.log("MicrosoftAuthStep: isAuthenticated =", isAuthenticated);
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
