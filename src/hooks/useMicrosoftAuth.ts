
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

  useEffect(() => {
    if (settings?.clientId && settings?.tenantId) {
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
          setIsAuthenticated(true);
        }
      });
    }
  }, [settings]);

  const login = useCallback(async () => {
    if (!msalInstance) {
      setError("Configuration Microsoft non disponible");
      return null;
    }

    try {
      const response: AuthenticationResult = await msalInstance.loginPopup({
        scopes: ["Calendars.Read"],
        prompt: "select_account",
      });

      if (response.account) {
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
      await msalInstance.logoutPopup();
      setIsAuthenticated(false);
      setError(null);
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

