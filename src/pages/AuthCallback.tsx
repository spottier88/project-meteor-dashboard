
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";

// Fonction pour nettoyer les cookies Supabase
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        logger.debug("Traitement du callback d'authentification", "auth");
        
        // Récupère les paramètres de l'URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Vérifier le mode réinitialisation - amélioration de la détection
        const isReset = queryParams.get('reset') === 'true' || 
                        hashParams.get('type') === 'recovery' ||
                        // Ajout d'une vérification pour détecter le token de récupération
                        hashParams.get('access_token') !== null && (
                          hashParams.get('type') === 'recovery' || 
                          hashParams.has('refresh_token')
                        );
        
        if (isReset) {
          logger.debug("Mode réinitialisation de mot de passe détecté", "auth");
          setIsResetMode(true);
          return; // Ne pas poursuivre le traitement normal
        }
        
        // Vérifie s'il y a une erreur dans les paramètres
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        // Récupère la session de manière plus directe
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!data.session) {
          logger.debug("Aucune session trouvée dans le callback", "auth");
          throw new Error("No session found");
        }

        // Authentification réussie
        logger.debug("Authentification réussie via callback", "auth");
        toast({
          title: "Connexion réussie",
          description: "Vous allez être redirigé vers la page d'accueil",
        });

        // Redirection vers la page principale
        navigate("/");
      } catch (err) {
        console.error("Erreur dans le callback d'authentification:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'authentification");
        
        // En cas d'erreur, nettoyer les cookies Supabase et se déconnecter
        try {
          logger.debug("Tentative de déconnexion suite à une erreur d'authentification", "auth");
          await supabase.auth.signOut();
          clearSupabaseCookies();
          
          toast({
            variant: "destructive",
            title: "Erreur d'authentification",
            description: err instanceof Error ? err.message : "Une erreur est survenue lors de l'authentification",
          });
        } catch (logoutError) {
          console.error("Erreur supplémentaire lors de la déconnexion:", logoutError);
        }

        // En cas d'erreur, redirection vers la page de login après un court délai
        setTimeout(() => {
          logger.debug("Redirection vers /login depuis AuthCallback suite à une erreur", "auth");
          window.location.href = "/login";
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  // Gestionnaire pour définir un nouveau mot de passe
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès",
      });
      
      // Laisser un peu de temps pour voir le message de succès
      setTimeout(() => {
        navigate("/");
      }, 1500);
      
    } catch (err) {
      console.error("Erreur lors de la mise à jour du mot de passe:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Une erreur est survenue lors de la mise à jour du mot de passe",
      });
    } finally {
      setLoading(false);
    }
  };

  // Affichage du formulaire de réinitialisation de mot de passe
  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Définir un nouveau mot de passe</h2>
            <p className="mt-2 text-sm text-gray-600">
              Veuillez créer un nouveau mot de passe sécurisé
            </p>
          </div>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 p-2 w-full border rounded-md"
                placeholder="Votre nouveau mot de passe"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 p-2 w-full border rounded-md"
                placeholder="Confirmez votre mot de passe"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Mise à jour en cours..." : "Mettre à jour mon mot de passe"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
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

  // Affichage par défaut (chargement)
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
