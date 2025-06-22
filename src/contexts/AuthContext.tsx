
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface définissant l'état d'authentification partagé
 * Utilisé pour synchroniser AuthGuard et PermissionsProvider
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean; // Indique si l'état initial a été déterminé
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Provider d'authentification centralisé
 * Gère l'état d'authentification de manière unifiée pour toute l'application
 * Évite les race conditions entre les différents composants
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log("[AuthProvider] État:", { 
    hasUser: !!user, 
    hasSession: !!session, 
    isLoading, 
    isInitialized 
  });

  useEffect(() => {
    let mounted = true;

    // Vérifier la session existante
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error("[AuthProvider] Erreur lors de la récupération de session:", error);
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
          setIsInitialized(true);
          
          console.log("[AuthProvider] Session initiale:", !!session);
        }
      } catch (error) {
        console.error("[AuthProvider] Erreur inattendue:", error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log("[AuthProvider] Auth state change:", event, !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        setIsInitialized(true);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const authState: AuthState = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    isInitialized
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook pour accéder à l'état d'authentification partagé
 * Utilisé par AuthGuard et PermissionsProvider pour une synchronisation parfaite
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
