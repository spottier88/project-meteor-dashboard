
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie si l'utilisateur actuel aurait accès au projet avec les données mises à jour
 * @param userId ID de l'utilisateur actuel
 * @param projectId ID du projet en cours de modification
 * @param newProjectManager Email du nouveau chef de projet
 * @param poleId ID du pôle affecté au projet
 * @param directionId ID de la direction affectée au projet
 * @param serviceId ID du service affecté au projet
 * @returns true si l'utilisateur aura toujours accès, false sinon
 */
export const willUserStillHaveAccess = async (
  userId: string | undefined,
  projectId: string,
  newProjectManager: string,
  poleId: string | null,
  directionId: string | null,
  serviceId: string | null,
): Promise<boolean> => {
  if (!userId) return false;
  
  // 1. Récupérer l'email de l'utilisateur actuel
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();
  
  const userEmail = userProfile?.email;
  
  // 2. Vérifier si l'utilisateur sera le chef de projet
  if (userEmail === newProjectManager) {
    return true;
  }
  
  // 3. Vérifier si l'utilisateur est admin
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  
  if (userRoles?.some(ur => ur.role === "admin")) {
    return true;
  }
  
  // 4. Vérifier si l'utilisateur est un manager qui aura accès après la modification
  const { data: managerAssignments } = await supabase
    .from("manager_assignments")
    .select("entity_id, entity_type")
    .eq("user_id", userId);
  
  if (managerAssignments) {
    const hasAccess = managerAssignments.some(assignment => {
      switch (assignment.entity_type) {
        case 'service':
          return serviceId && assignment.entity_id === serviceId;
        case 'direction':
          return directionId && assignment.entity_id === directionId;
        case 'pole':
          return poleId && assignment.entity_id === poleId;
        default:
          return false;
      }
    });
    
    if (hasAccess) {
      return true;
    }
  }
  
  // 5. Vérifier si l'utilisateur sera membre du projet (s'il est déjà membre)
  const { data: projectMember } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  
  if (projectMember) {
    return true;
  }
  
  return false;
};
