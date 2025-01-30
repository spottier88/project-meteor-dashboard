import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser, useSession } from '@supabase/auth-helpers-react';
import { UserRole } from '@/types/user';

interface PermissionsState {
  userRoles: UserRole[] | undefined;
  userProfile: any | null;
  isAdmin: boolean;
  isManager: boolean;
  isProjectManager: boolean;
  isMember: boolean;
  highestRole: UserRole | null;
  hasRole: (role: UserRole) => boolean;
  isLoading: boolean;
  isError: boolean;
}

const PermissionsContext = createContext<PermissionsState | undefined>(undefined);

const roleHierarchy: UserRole[] = ['admin', 'manager', 'chef_projet', 'membre'];

let hookCallCount = 0;

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const session = useSession();
  hookCallCount++;
  
  console.log(`[PermissionsProvider] Hook called ${hookCallCount} times`, {
    userId: user?.id,
    sessionStatus: !!session,
    timestamp: new Date().toISOString()
  });

  const { data: userRoles, isLoading: isLoadingRoles, isError: isRolesError } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[PermissionsProvider] No user ID available");
        return [];
      }
      console.log("[PermissionsProvider] Fetching roles for user:", user.id);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("[PermissionsProvider] Error fetching user roles:", error);
        throw error;
      }
      const roles = data.map(ur => ur.role as UserRole);
      console.log("[PermissionsProvider] Fetched roles:", roles);
      return roles;
    },
    enabled: !!user?.id && !!session,
    staleTime: 60000,
    retry: 3,
  });

  const { data: userProfile, isLoading: isLoadingProfile, isError: isProfileError } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[PermissionsProvider] No user ID available for profile");
        return null;
      }
      console.log("[PermissionsProvider] Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("[PermissionsProvider] Error fetching user profile:", error);
        throw error;
      }
      console.log("[PermissionsProvider] Fetched profile:", data);
      return data;
    },
    enabled: !!user?.id && !!session,
    staleTime: 60000,
    retry: 3,
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
    console.log(`[PermissionsProvider] Checking role ${role}:`, {
      hasRequestedRole,
      userRoles,
      userId: user?.id
    });
    return hasRequestedRole;
  };

  const highestRole = userRoles && userRoles.length > 0 ? getHighestRole(userRoles) : null;
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isProjectManager = hasRole('chef_projet');
  const isMember = hasRole('membre');
  const isLoading = isLoadingRoles || isLoadingProfile;
  const isError = isRolesError || isProfileError;

  useEffect(() => {
    console.log("[PermissionsProvider] State update:", {
      userId: user?.id,
      userEmail: userProfile?.email,
      userRoles,
      highestRole,
      isAdmin,
      isManager,
      isProjectManager,
      isMember,
      isLoading,
      isError,
      sessionStatus: !!session
    });
  }, [user?.id, userProfile, userRoles, highestRole, isAdmin, isManager, isProjectManager, isMember, isLoading, isError, session]);

  if (!session || isLoading) {
    console.log("[PermissionsProvider] Loading state:", {
      session: !!session,
      isLoading
    });
    return null;
  }

  if (isError) {
    console.error("[PermissionsProvider] Error loading permissions");
    return null;
  }

  return (
    <PermissionsContext.Provider value={{
      userRoles,
      userProfile,
      isAdmin,
      isManager,
      isProjectManager,
      isMember,
      highestRole,
      hasRole,
      isLoading,
      isError,
    }}>
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