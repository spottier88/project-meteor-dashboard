
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// Fonction pour nettoyer explicitement les cookies Supabase
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

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isMagicLink, setIsMagicLink] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Fonction pour déconnecter complètement l'utilisateur et nettoyer les données de session
  const handleLogout = async () => {
    try {
      console.log("Déconnexion et nettoyage forcés");
      
      // Déconnexion via Supabase
      await supabase.auth.signOut({ scope: 'local' });
      
      // Nettoyage explicite des cookies Supabase
      clearSupabaseCookies();
      
      // Réinitialisation des états locaux
      setEmail("");
      setPassword("");
      setLoading(false);
      setMessage("");
      setIsCheckingSession(false);
      
      console.log("Déconnexion et nettoyage effectués avec succès");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // En cas d'erreur, forcer quand même le nettoyage des cookies
      clearSupabaseCookies();
      setIsCheckingSession(false);
    }
  };

  // Simplification de la vérification de session - une seule fois au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Vérification de session au démarrage");
        setIsCheckingSession(true);
        
        // Récupérer la session actuelle
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erreur lors de la vérification de session:", sessionError);
          await handleLogout();
          return;
        }

        // Si session active et valide
        if (sessionData?.session) {
          console.log("Session active détectée, redirection vers la page principale");
          navigate("/");
        } else {
          console.log("Aucune session active détectée");
          // S'assurer que tout est propre quand aucune session n'est détectée
          await handleLogout();
        }
      } catch (error) {
        console.error("Erreur inattendue lors de la vérification de session:", error);
        await handleLogout();
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  // Gestionnaire d'état d'authentification simplifié
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Événement d'authentification:", event);
      
      if (event === 'SIGNED_OUT') {
        console.log("Événement SIGNED_OUT détecté, nettoyage et mise à jour de l'UI");
        await handleLogout();
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        console.log("Événement SIGNED_IN détecté, redirection vers /");
        navigate("/");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // 🔹 Connexion avec Magic Link
  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Vérifiez votre boîte mail pour valider votre connexion.");
    }
  };

  // 🔹 Connexion avec email/mot de passe
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
      // En cas d'erreur de connexion, nettoyer les cookies potentiellement problématiques
      clearSupabaseCookies();
    }
  };

  // 🔹 Inscription avec email/mot de passe
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
    }
  };

  // Déconnexion manuelle et nettoyage complet
  const handleManualReset = async () => {
    await handleLogout();
    toast({
      title: "Session réinitialisée",
      description: "Toutes les données de session ont été supprimées",
    });
    setMessage("Session réinitialisée avec succès.");
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Vérification de la session...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Connexion à Meteor</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isMagicLink
              ? "Entrez votre email pour recevoir un lien de connexion"
              : "Connectez-vous avec votre email et mot de passe"}
          </p>
        </div>

        {/* 🔹 Bouton pour changer de mode (Magic Link <-> Email/MDP) */}
        <button
          onClick={() => setIsMagicLink(!isMagicLink)}
          className="w-full text-blue-600 font-medium p-2 rounded-md hover:underline"
        >
          {isMagicLink ? "Se connecter avec un mot de passe" : "Utiliser un Magic Link"}
        </button>

        {/* 🔹 Formulaire Magic Link */}
        {isMagicLink ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 p-2 w-full border rounded-md"
                placeholder="Votre adresse email"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Envoi en cours..." : "Recevoir le lien de connexion"}
            </button>
          </form>
        ) : (
          // 🔹 Formulaire Email / Mot de passe
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 p-2 w-full border rounded-md"
                placeholder="Votre adresse email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 p-2 w-full border rounded-md"
                placeholder="Votre mot de passe"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        )}

        {/* 🔹 Bouton d'inscription (email + mot de passe) */}
        {!isMagicLink && (
          <button
            onClick={handleSignup}
            className="w-full bg-gray-200 text-gray-700 p-2 rounded-md hover:bg-gray-300"
            disabled={loading}
          >
            {loading ? "Inscription en cours..." : "Créer un compte"}
          </button>
        )}

        {/* 🔹 Bouton de réinitialisation manuelle en cas de problème */}
        <button 
          onClick={handleManualReset}
          className="w-full text-red-600 text-sm p-2 mt-6 rounded-md hover:underline"
        >
          Réinitialiser la session
        </button>

        {/* 🔹 Affichage des messages (erreurs ou confirmation) */}
        {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default Login;
