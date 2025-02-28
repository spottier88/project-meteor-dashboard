
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

  // Déclencher le callback de succès lorsque l'authentification est réussie
  useEffect(() => {
    console.log("Auth step checking authentication state:", isAuthenticated);
    if (isAuthenticated) {
      console.log("Auth step detected successful authentication, triggering callback");
      onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connectez-vous avec votre compte Microsoft pour accéder à votre calendrier.
      </p>
      <MicrosoftAuthButton />
    </div>
  );
};
