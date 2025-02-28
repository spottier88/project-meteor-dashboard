
import { Button } from "@/components/ui/button";
import { useMicrosoftAuth } from "@/hooks/useMicrosoftAuth";
import { Check, X } from "lucide-react";
import { useEffect } from "react";

export const MicrosoftAuthButton = () => {
  const { login, logout, isAuthenticated, error, isConfigured } = useMicrosoftAuth();

  // Log de débogage pour suivre l'état d'authentification
  useEffect(() => {
    console.log("MicrosoftAuthButton auth state:", isAuthenticated ? "authenticated" : "not authenticated");
  }, [isAuthenticated]);

  if (!isConfigured) {
    return (
      <Button variant="outline" disabled className="w-full">
        Configuration Microsoft manquante
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant={isAuthenticated ? "outline" : "default"}
        onClick={isAuthenticated ? logout : login}
        className="w-full"
      >
        {isAuthenticated ? "Se déconnecter de Microsoft" : "Se connecter à Microsoft"}
      </Button>
      
      {isAuthenticated && (
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
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <X className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
