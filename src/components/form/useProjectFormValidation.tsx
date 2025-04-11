
/**
 * @hook useProjectFormValidation
 * @description Hook personnalisé gérant la validation du formulaire de projet.
 * Récupère les rôles de l'utilisateur connecté et fournit des fonctions de validation
 * pour chaque étape du formulaire multi-étapes de création/édition de projet.
 */

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";

export const useProjectFormValidation = () => {
  const user = useUser();

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(ur => ur.role === 'admin') || false;
  const isManager = userRoles?.some(ur => ur.role === 'manager') || false;
  
  // Log pour vérifier les valeurs
  console.log("useProjectFormValidation - roles detected:", {
    userRoles: userRoles?.map(ur => ur.role),
    isAdmin,
    isManager
  });

  const validateStep1 = (title: string, projectManager: string) => {
    return title.trim() !== "" && projectManager.trim() !== "";
  };

  const validateStep2 = () => {
    return true;
  };

  const validateStep3 = () => {
    return true;
  };

  return {
    isAdmin,
    isManager,
    userRoles,
    validateStep1,
    validateStep2,
    validateStep3,
  };
};
