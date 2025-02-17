import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";


const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isMagicLink, setIsMagicLink] = useState(true); // Toggle entre Magic Link et Login/MDP

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/");
      }
    };
    checkSession();

    // Écouter les changements d'authentification
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
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
    } else {
      navigate("/");
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
    });

    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
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

        {/* 🔹 Affichage des messages (erreurs ou confirmation) */}
        {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default Login;

