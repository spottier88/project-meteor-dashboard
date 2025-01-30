import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { UserRole } from '@/types/user';

interface PermissionsContextType {
  userRoles: UserRole[] | undefined;
  userProfile: any | null;
  isAdmin: boolean;
  isManager: boolean;
  isProjectManager: boolean;
  isMember: boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();

  const { data: userRoles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("Fetching roles for user:", user.id);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        throw error;
      }
      const roles = data.map(ur => ur.role as UserRole);
      console.log("Fetched user roles:", roles);
      return roles;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }
      console.log("Fetched user profile:", data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });

  // Vérification des rôles par ordre de priorité
  const isAdmin = Array.isArray(userRoles) && userRoles.includes('admin');
  const isManager = Array.isArray(userRoles) && userRoles.includes('manager');
  const isProjectManager = Array.isArray(userRoles) && userRoles.includes('chef_projet');
  const isMember = Array.isArray(userRoles) && userRoles.includes('membre');
  const isLoading = isLoadingRoles || isLoadingProfile;

  console.log("PermissionsContext state:", {
    userRoles,
    isAdmin,
    isManager,
    isProjectManager,
    isMember,
    userProfile,
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