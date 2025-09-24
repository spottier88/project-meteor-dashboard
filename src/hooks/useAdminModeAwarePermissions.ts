/**
 * @hook useAdminModeAwarePermissions
 * @description Hook centralisé pour adapter tous les hooks de permissions existants
 * au nouveau système de switch admin On/Off. Ce hook wrapp les autres hooks pour
 * s'assurer qu'ils utilisent tous le statut admin effectif.
 */

import { useAdminModeAwareData } from "./useAdminModeAwareData";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useAdminModeAwarePermissions = () => {
  const { effectiveAdminStatus, hasAdminRole, adminRoleDisabled } = useAdminModeAwareData();
  const { 
    userRoles, 
    userProfile, 
    isManager, 
    isProjectManager, 
    isMember, 
    isTimeTracker, 
    highestRole, 
    hasRole, 
    isLoading, 
    isError,
    accessibleOrganizations,
    isLoadingOrganizations
  } = usePermissionsContext();
  
  return {
    // Propriétés adaptées au mode admin
    isAdmin: effectiveAdminStatus, // Version effective qui tient compte du switch
    canAccessAllOrganizations: effectiveAdminStatus, // Idem
    
    // Propriétés originales du rôle admin
    hasAdminRole,
    adminRoleDisabled,
    
    // Propriétés inchangées (pas impactées par le switch admin)
    userRoles,
    userProfile,
    isManager,
    isProjectManager,
    isMember,
    isTimeTracker,
    highestRole,
    hasRole,
    isLoading,
    isError,
    accessibleOrganizations,
    isLoadingOrganizations,
    
    // Méthodes utilitaires
    toggleAdminRole: () => {
      // Cette fonction sera implémentée dans le contexte
    }
  };
};