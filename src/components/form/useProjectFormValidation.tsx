import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleData } from "@/types/user";

export const useProjectFormValidation = (formState: any, userProfile: any) => {
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

  const isAdmin = userRoles?.some(ur => ur.role === 'admin');
  const isManager = userRoles?.some(ur => ur.role === 'manager');

  const validateStep1 = (title: string, projectManager: string) => {
    return title.trim() !== "" && projectManager.trim() !== "";
  };

  const validateStep2 = () => {
    return true;
  };

  const validateStep3 = () => {
    return true;
  };

  const validateForm = () => {
    if (!formState.title.trim()) {
      return "Le titre du projet est requis";
    }
    if (!formState.projectManager.trim()) {
      return "Le chef de projet est requis";
    }
    if (formState.startDate && formState.endDate && formState.startDate > formState.endDate) {
      return "La date de fin doit être postérieure à la date de début";
    }
    return null;
  };

  return {
    isAdmin,
    isManager,
    userRoles,
    validateStep1,
    validateStep2,
    validateStep3,
    validateForm
  };
};