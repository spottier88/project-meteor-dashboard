import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
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
}

const PermissionsContext = createContext<PermissionsState | undefined>(undefined);

const roleHierarchy: UserRole[] = ['admin', 'manager', 'chef_projet', 'membre'];

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();

  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log("PermissionsContext - Fetching roles for user:", user.id);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }
      const roles = data.map(ur => ur.role as UserRole);
      console.log("PermissionsContext - Fetched roles:", roles);
      return roles;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("PermissionsContext - Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      console.log("PermissionsContext - Fetched profile:", data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
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
    console.log(`PermissionsContext - Checking role ${role} for user ${userProfile?.email}:`, {
      hasRequestedRole,
      userRoles
    });
    return hasRequestedRole;
  };

  const highestRole = userRoles && userRoles.length > 0 ? getHighestRole(userRoles) : null;

  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isProjectManager = hasRole('chef_projet');
  const isMember = hasRole('membre');
  const isLoading = isLoadingRoles || isLoadingProfile;

  console.log("PermissionsContext - Final state:", {
    userEmail: userProfile?.email,
    userRoles,
    highestRole,
    isAdmin,
    isManager,
    isProjectManager,
    isMember,
    isLoading,
  });

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