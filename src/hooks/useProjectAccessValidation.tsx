
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseProjectAccessValidationProps {
  userId?: string;
}

export const useProjectAccessValidation = ({ userId }: UseProjectAccessValidationProps) => {
  const [showAccessWarning, setShowAccessWarning] = useState(false);
  const [isProceedingAnyway, setIsProceedingAnyway] = useState(false);

  // Vérifier si l'utilisateur aura toujours accès après modification
  const willUserStillHaveAccess = async (
    userId: string | undefined,
    projectId: string,
    newProjectManager: string,
  ): Promise<boolean> => {
    if (!userId) return false;

    // Si l'utilisateur est le nouveau chef de projet, il aura toujours accès
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (userProfile?.email === newProjectManager) {
      return true;
    }

    // Vérifier si l'utilisateur est admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (userRoles?.some(ur => ur.role === 'admin')) {
      return true;
    }

    // Vérifier si l'utilisateur est membre du projet
    const { data: isMember } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    return !!isMember;
  };

  const handleProceedAnyway = () => {
    setIsProceedingAnyway(true);
    setShowAccessWarning(false);
    return true;
  };

  const handleCancelSubmit = () => {
    setShowAccessWarning(false);
    return false;
  };

  return { 
    showAccessWarning,
    setShowAccessWarning, 
    isProceedingAnyway, 
    setIsProceedingAnyway, 
    willUserStillHaveAccess,
    handleProceedAnyway,
    handleCancelSubmit
  };
};
