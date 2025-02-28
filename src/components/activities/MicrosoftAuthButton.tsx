
import { Button } from "@/components/ui/button";
import { useMicrosoftAuth } from "@/hooks/useMicrosoftAuth";
import { Check, X } from "lucide-react";
import { useEffect } from "react";

interface MicrosoftAuthButtonProps {
  onAuthSuccess?: () => void;
}

export const MicrosoftAuthButton = ({ onAuthSuccess }: MicrosoftAuthButtonProps) => {
  const { login, logout, isAuthenticated, error, isConfigured } = useMicrosoftAuth();

  // Log de débogage pour suivre l'état d'authentification
  useEffect(() => {
    console.log("MicrosoftAuthButton: Auth state changed to:", isAuthenticated ? "authenticated" : "not authenticated");
  }, [isAuthenticated]);

  const handleLogin = async () => {
    console.log("MicrosoftAuthButton: Handling login click");
    try {
      const response = await login();
      console.log("MicrosoftAuthButton: Login response:", response ? "success" : "failed");
      
      if (response && onAuthSuccess) {
        console.log("MicrosoftAuthButton: Login successful, triggering onAuthSuccess callback");
        onAuthSuccess();
      }
    } catch (err) {
      console.error("MicrosoftAuthButton: Login error:", err);
    }
  };

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
        onClick={isAuthenticated ? logout : handleLogin}
        className="w-full"
      >
        {isAuthenticated ? "Se déconnecter de Microsoft" : "Se connecter à Microsoft"}
      </Button>
      
      {isAuthenticated && (
        <>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>Connecté à Microsoft Graph</span>
          </div>
          {onAuthSuccess && (
            <Button 
              variant="default" 
              className="w-full" 
              onClick={onAuthSuccess}
            >
              Continuer
            </Button>
          )}
        </>
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
