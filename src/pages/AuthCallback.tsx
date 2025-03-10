
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Fonction pour nettoyer les cookies Supabase (dupliquée de Login.tsx)
const clearSupabaseCookies = () => {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // Supprimer tous les cookies liés à Supabase
    if (name.startsWith("sb-")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }
  }
};

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Récupère les paramètres de l'URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Vérifie s'il y a une erreur dans les paramètres
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        // Récupère la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error("No session found");
        }

        // Authentification réussie
        toast({
          title: "Connexion réussie",
          description: "Vous allez être redirigé vers la page d'accueil",
        });

        // Redirection vers la page principale
        navigate("/");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'authentification");
        
        // En cas d'erreur, nettoyer les cookies Supabase
        clearSupabaseCookies();
        
        toast({
          variant: "destructive",
          title: "Erreur d'authentification",
          description: err instanceof Error ? err.message : "Une erreur est survenue lors de l'authentification",
        });

        // En cas d'erreur, redirection vers la page de login après un court délai
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center text-red-600">
            <h2 className="text-xl font-bold">Erreur d'authentification</h2>
            <p className="mt-2">{error}</p>
            <p className="mt-4 text-gray-600">Redirection vers la page de connexion...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-xl font-bold">Authentification en cours...</h2>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
