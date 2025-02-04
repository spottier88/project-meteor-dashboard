import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous pour accéder à votre tableau de bord
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={`${window.location.origin}/auth/callback`}
          magicLink={true}
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                password_label: "Mot de passe",
                email_input_placeholder: "Votre adresse email",
                password_input_placeholder: "Votre mot de passe",
                button_label: "Se connecter",
                loading_button_label: "Connexion en cours...",
                link_text: "Déjà inscrit ? Connectez-vous",
                magic_link_text: "Se connecter avec un magic link",
                magic_link_button_label: "Envoyer le magic link",
                magic_link_button_loading: "Envoi en cours...",
                magic_link_sent_text: "Un email contenant le magic link a été envoyé à votre adresse email",
              },
              sign_up: {
                email_label: "Email",
                password_label: "Mot de passe",
                email_input_placeholder: "Votre adresse email",
                password_input_placeholder: "Votre mot de passe",
                button_label: "S'inscrire",
                loading_button_label: "Inscription en cours...",
                link_text: "Pas encore de compte ? Inscrivez-vous",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;