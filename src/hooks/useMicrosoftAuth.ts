
import { useState, useCallback, useEffect } from "react";
import { PublicClientApplication, AuthenticationResult } from "@azure/msal-browser";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MicrosoftSettings {
  clientId: string;
  tenantId: string;
}

const fetchMicrosoftSettings = async (): Promise<MicrosoftSettings> => {
  const { data: settings, error } = await supabase
    .from("application_settings")
    .select("*")
    .eq("type", "microsoft_graph");

  if (error) throw error;

  const formattedSettings = settings.reduce((acc: MicrosoftSettings, setting) => {
    acc[setting.key === "client_id" ? "clientId" : "tenantId"] = setting.value;
    return acc;
  }, {} as MicrosoftSettings);

  return formattedSettings;
};

export const useMicrosoftAuth = () => {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: settings } = useQuery({
    queryKey: ["msGraphSettings"],
    queryFn: fetchMicrosoftSettings,
  });

  // Fonction pour vérifier l'état d'authentification actuel
  const checkAuthStatus = useCallback(() => {
    if (!msalInstance) return false;
    
    const accounts = msalInstance.getAllAccounts();
    const authState = accounts.length > 0;
    
    console.log("Current auth state check:", authState ? "authenticated" : "not authenticated");
    return authState;
  }, [msalInstance]);

  // Effet pour initialiser msalInstance quand les paramètres sont chargés
  useEffect(() => {
    if (settings?.clientId && settings?.tenantId) {
      console.log("Initializing MSAL with settings", settings);
      const msalConfig = {
        auth: {
          clientId: settings.clientId,
          authority: `https://login.microsoftonline.com/${settings.tenantId}`,
          redirectUri: window.location.origin,
        },
        cache: {
          cacheLocation: "sessionStorage",
          storeAuthStateInCookie: false,
        },
      };

      const msalInstance = new PublicClientApplication(msalConfig);
      msalInstance.initialize().then(() => {
        setMsalInstance(msalInstance);
        
        // Vérifier si un compte est déjà connecté
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          console.log("Found existing account", accounts[0].username);
          setIsAuthenticated(true);
        } else {
          console.log("No existing account found");
          setIsAuthenticated(false);
        }
      });
    }
  }, [settings]);

  // Effet pour vérifier l'état d'authentification à chaque changement de msalInstance
  useEffect(() => {
    if (msalInstance) {
      const currentAuthState = checkAuthStatus();
      console.log("Effect: updating auth state to", currentAuthState ? "authenticated" : "not authenticated");
      setIsAuthenticated(currentAuthState);
    }
  }, [msalInstance, checkAuthStatus]);

  const login = useCallback(async () => {
    if (!msalInstance) {
      setError("Configuration Microsoft non disponible");
      return null;
    }

    try {
      console.log("Attempting login with MSAL");
      const response: AuthenticationResult = await msalInstance.loginPopup({
        scopes: ["Calendars.Read"],
        prompt: "select_account",
      });

      if (response.account) {
        console.log("Login successful", response.account.username);
        // Mettre à jour immédiatement l'état d'authentification
        setIsAuthenticated(true);
        setError(null);
        return response;
      }
    } catch (err) {
      console.error("Erreur de connexion Microsoft:", err);
      setError("Échec de la connexion Microsoft");
      setIsAuthenticated(false);
    }

    return null;
  }, [msalInstance]);

  const logout = useCallback(async () => {
    if (!msalInstance) return;

    try {
      console.log("Attempting logout with MSAL");
      await msalInstance.logoutPopup();
      setIsAuthenticated(false);
      setError(null);
      console.log("Logout successful");
    } catch (err) {
      console.error("Erreur de déconnexion Microsoft:", err);
      setError("Échec de la déconnexion");
    }
  }, [msalInstance]);

  const getMSALInstance = useCallback(() => {
    return msalInstance;
  }, [msalInstance]);

  return {
    login,
    logout,
    isAuthenticated,
    error,
    isConfigured: !!msalInstance,
    getMSALInstance,
  };
};
