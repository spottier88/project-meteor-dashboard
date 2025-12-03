import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie si l'utilisateur actuel aurait accès au projet avec les données mises à jour
 * Système unifié utilisant uniquement manager_path_assignments pour la cohérence
 * 
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
  // via manager_path_assignments (système unifié)
  
  // Trouver le hierarchy_path correspondant aux nouvelles valeurs du projet
  let targetPathId: string | null = null;
  
  // Chercher le chemin le plus spécifique possible
  if (serviceId) {
    const { data: servicePath } = await supabase
      .from("hierarchy_paths")
      .select("id, path_string")
      .eq("service_id", serviceId)
      .single();
    targetPathId = servicePath?.id || null;
  } else if (directionId) {
    const { data: directionPath } = await supabase
      .from("hierarchy_paths")
      .select("id, path_string")
      .eq("direction_id", directionId)
      .is("service_id", null)
      .single();
    targetPathId = directionPath?.id || null;
  } else if (poleId) {
    const { data: polePath } = await supabase
      .from("hierarchy_paths")
      .select("id, path_string")
      .eq("pole_id", poleId)
      .is("direction_id", null)
      .is("service_id", null)
      .single();
    targetPathId = polePath?.id || null;
  }
  
  if (targetPathId) {
    // Récupérer le path_string du projet cible
    const { data: targetPath } = await supabase
      .from("hierarchy_paths")
      .select("path_string")
      .eq("id", targetPathId)
      .single();
    
    if (targetPath) {
      // Récupérer les chemins assignés au manager via manager_path_assignments
      const { data: managerPaths } = await supabase
        .from("manager_path_assignments")
        .select(`
          path_id,
          hierarchy_paths!inner (
            path_string
          )
        `)
        .eq("user_id", userId);
      
      if (managerPaths && managerPaths.length > 0) {
        // Vérifier si l'un des chemins du manager est un préfixe du nouveau chemin du projet
        const hasAccess = managerPaths.some(mp => {
          const managerPathString = (mp.hierarchy_paths as any)?.path_string;
          if (!managerPathString) return false;
          return targetPath.path_string.startsWith(managerPathString);
        });
        
        if (hasAccess) {
          return true;
        }
      }
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
