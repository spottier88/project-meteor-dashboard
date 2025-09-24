/**
 * @hook useAdminModeAwareData
 * @description Hook personnalisé pour gérer les données en tenant compte du mode admin désactivé.
 * Fournit des utilitaires pour déterminer quand appliquer les privilèges admin ou non.
 */

import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const useAdminModeAwareData = () => {
  const { hasAdminRole, adminRoleDisabled } = usePermissionsContext();
  
  return {
    /**
     * Statut admin effectif : true seulement si l'utilisateur est admin ET que le mode n'est pas désactivé
     */
    effectiveAdminStatus: hasAdminRole && !adminRoleDisabled,
    
    /**
     * Indique si les privilèges admin doivent être utilisés pour les requêtes
     */
    shouldUseAdminMode: hasAdminRole && !adminRoleDisabled,
    
    /**
     * Valeur à passer aux fonctions RPC pour indiquer si le mode admin est désactivé
     */
    adminModeDisabled: adminRoleDisabled,
    
    /**
     * Vrai rôle admin (non impacté par le switch)
     */
    hasAdminRole,
    
    /**
     * État du switch admin
     */
    adminRoleDisabled
  };
};