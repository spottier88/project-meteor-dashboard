
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser, useSession } from '@supabase/auth-helpers-react';
import { UserRole, AccessibleOrganizations } from '@/types/user';
import { getUserAccessibleOrganizations } from '@/utils/organizationAccess';

interface PermissionsState {
  userRoles: UserRole[] | undefined;
  userProfile: any | null;
  isAdmin: boolean;
  isManager: boolean;
  isProjectManager: boolean;
  isMember: boolean;
  isTimeTracker: boolean;
  highestRole: UserRole | null;
  hasRole: (role: UserRole) => boolean;
  isLoading: boolean;
  isError: boolean;
  // Nouvelles propriétés
  accessibleOrganizations: AccessibleOrganizations | null;
  canAccessAllOrganizations: boolean;
  isLoadingOrganizations: boolean;
}

const PermissionsContext = createContext<PermissionsState | undefined>(undefined);

const roleHierarchy: UserRole[] = ['admin', 'manager', 'chef_projet', 'membre', 'time_tracker'];

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const session = useSession();
  const [accessibleOrganizations, setAccessibleOrganizations] = useState<AccessibleOrganizations | null>(null);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);

  console.log("[PermissionsProvider] Render avec:", { 
    hasUser: !!user?.id, 
    hasSession: !!session,
    userEmail: user?.email 
  });

  const { data: userRoles, isLoading: isLoadingRoles, isError: isRolesError } = useQuery({
    queryKey: ['userRoles', user?.id, session?.access_token] as const,
    queryFn: async () => {
      if (!user?.id) {
        console.log("[PermissionsProvider] No user ID available");
        return [];
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("[PermissionsProvider] Error fetching user roles:", error);
        throw error;
      }
      const roles = data.map(ur => ur.role as UserRole);
      console.log("[PermissionsProvider] Roles récupérés:", roles);
      return roles;
    },
    enabled: !!user?.id && !!session,
  });

  const { data: userProfile, isLoading: isLoadingProfile, isError: isProfileError } = useQuery({
    queryKey: ['userProfile', user?.id, session?.access_token] as const,
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("[PermissionsProvider] Error fetching user profile:", error);
        throw error;
      }
      return data;
    },
    enabled: !!user?.id && !!session,
  });

  const getHighestRole = (roles: UserRole[]): UserRole | null => {
    if (!roles || roles.length === 0) return null;
    for (const hierarchyRole of roleHierarchy) {
      if (roles.includes(hierarchyRole)) {
        return hierarchyRole;
      }
    }
    return null;
  };

  const hasRole = (role: UserRole): boolean => {
    if (!userRoles || userRoles.length === 0) return false;
    const hasRequestedRole = userRoles.includes(role);
    return hasRequestedRole;
  };

  const highestRole = userRoles && userRoles.length > 0 ? getHighestRole(userRoles) : null;
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isProjectManager = hasRole('chef_projet');
  const isMember = hasRole('membre');
  const isTimeTracker = hasRole('time_tracker');
  const isLoading = isLoadingRoles || isLoadingProfile;
  const isError = isRolesError || isProfileError;
  const canAccessAllOrganizations = isAdmin;

  // Chargement des organisations accessibles
  useEffect(() => {
    async function loadAccessibleOrganizations() {
      if (user?.id && !isLoading && !isError) {
        setIsLoadingOrganizations(true);
        try {
          const organizations = await getUserAccessibleOrganizations(user.id, isAdmin, isManager);
          setAccessibleOrganizations(organizations);
        } catch (error) {
          console.error("[PermissionsProvider] Error loading accessible organizations:", error);
        } finally {
          setIsLoadingOrganizations(false);
        }
      }
    }

    loadAccessibleOrganizations();
  }, [user?.id, isAdmin, isManager, isLoading, isError, userRoles]);

  console.log("[PermissionsProvider] État final:", {
    userId: user?.id,
    hasSession: !!session,
    userRoles,
    isAdmin,
    isLoading,
    isError,
    willRenderChildren: !!session
  });

  // CORRECTION: Ne jamais retourner null si une session existe
  // Même en cas d'erreur ou de chargement, on fournit un contexte valide
  if (!session) {
    console.log("[PermissionsProvider] Pas de session, pas de rendu");
    return null;
  }

  // Toujours fournir un contexte valide quand il y a une session
  const contextValue: PermissionsState = {
    userRoles: userRoles || [],
    userProfile,
    isAdmin,
    isManager,
    isProjectManager,
    isMember,
    isTimeTracker,
    highestRole,
    hasRole,
    isLoading,
    isError,
    accessibleOrganizations,
    canAccessAllOrganizations,
    isLoadingOrganizations
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}
