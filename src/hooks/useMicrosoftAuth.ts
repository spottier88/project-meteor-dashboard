import { useState, useCallback, useEffect } from "react";
import { PublicClientApplication, AuthenticationResult } from "@azure/msal-browser";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

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

  // Vérifier l'état d'authentification actuel
  const checkAuthStatus = useCallback(() => {
    if (!msalInstance) {
      logger.debug("checkAuthStatus: No MSAL instance available");
      return false;
    }
    
    const accounts = msalInstance.getAllAccounts();
    const authState = accounts.length > 0;
    
    logger.debug(
      `checkAuthStatus: Current auth state: ${authState ? "authenticated" : "not authenticated"}, accounts: ${accounts.length}`
    );
    return authState;
  }, [msalInstance]);

  // Effet initial pour configurer MSAL et vérifier l'authentification
  useEffect(() => {
    if (!settings?.clientId || !settings?.tenantId) {
      logger.debug("useMicrosoftAuth: No settings available yet");
      return;
    }
    
    // console.log("useMicrosoftAuth: Initializing MSAL with settings", settings);
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

    try {
      const newMsalInstance = new PublicClientApplication(msalConfig);
      newMsalInstance.initialize().then(() => {
        logger.debug("useMicrosoftAuth: MSAL initialized successfully");
        setMsalInstance(newMsalInstance);
        
        // Vérification de l'état d'authentification après initialisation
        const accounts = newMsalInstance.getAllAccounts();
        const initialAuthState = accounts.length > 0;
        
        logger.debug(
          `useMicrosoftAuth: Initial auth state: ${initialAuthState ? "authenticated" : "not authenticated"}, accounts: ${accounts.length}`
        );
        setIsAuthenticated(initialAuthState);
      });
    } catch (err) {
      console.error("useMicrosoftAuth: MSAL initialization error:", err);
      setError("Erreur d'initialisation Microsoft");
    }
  }, [settings]);

  // Log whenever isAuthenticated changes
  useEffect(() => {
    logger.debug(
      `useMicrosoftAuth: isAuthenticated state changed to: ${isAuthenticated}`
    );
  }, [isAuthenticated]);

  const login = useCallback(async () => {
    if (!msalInstance) {
      logger.debug("login: No MSAL instance available");
      setError("Configuration Microsoft non disponible");
      return null;
    }

    try {
      logger.debug("login: Attempting login with MSAL");
      const response: AuthenticationResult = await msalInstance.loginPopup({
        scopes: ["Calendars.Read"],
        prompt: "select_account",
      });

      if (response.account) {
        logger.debug("login: Login successful for", response.account.username);
        setIsAuthenticated(true);
        setError(null);
        return response;
      }
    } catch (err) {
      console.error("login: Erreur de connexion Microsoft:", err);
      setError("Échec de la connexion Microsoft");
      setIsAuthenticated(false);
    }

    return null;
  }, [msalInstance]);

  const logout = useCallback(async () => {
    if (!msalInstance) {
      logger.debug("logout: No MSAL instance available");
      return;
    }

    try {
      logger.debug("logout: Attempting logout with MSAL");
      await msalInstance.logoutPopup();
      setIsAuthenticated(false);
      setError(null);
      logger.debug("logout: Logout successful");
    } catch (err) {
      console.error("logout: Erreur de déconnexion Microsoft:", err);
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
    checkAuthStatus,
    setIsAuthenticated,
  };
};
