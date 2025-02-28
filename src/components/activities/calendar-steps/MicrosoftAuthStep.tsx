
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MicrosoftAuthButton } from '../MicrosoftAuthButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { Check } from 'lucide-react';

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
      console.log("Auth step detected successful authentication, trigger is available");
      // Nous n'appelons plus automatiquement onAuthSuccess pour éviter les problèmes
      // de timing et de rendu. L'utilisateur utilisera le bouton "Continuer" à la place.
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connectez-vous avec votre compte Microsoft pour accéder à votre calendrier.
      </p>
      <MicrosoftAuthButton />
      
      {isAuthenticated && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>Connecté à Microsoft Graph</span>
          </div>
          
          <Button 
            variant="default" 
            className="w-full" 
            onClick={onAuthSuccess}
          >
            Continuer
          </Button>
        </div>
      )}
    </div>
  );
};
