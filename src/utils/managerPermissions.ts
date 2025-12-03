import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie si un manager a accès à un projet via les chemins hiérarchiques (manager_path_assignments)
 * Système unifié utilisant uniquement manager_path_assignments pour la cohérence
 * 
 * @param userId ID de l'utilisateur
 * @param projectId ID du projet
 * @param userEmail Email de l'utilisateur (optionnel, pour vérifier si chef de projet)
 * @returns true si l'utilisateur peut accéder au projet
 */
export const canManagerAccessProject = async (
  userId: string | undefined,
  projectId: string,
  userEmail?: string | null
): Promise<boolean> => {
  if (!userId) return false;

  // Vérifier si l'utilisateur est admin
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (userRoles?.some(ur => ur.role === "admin")) return true;

  // Vérifier si l'utilisateur est le propriétaire ou le chef de projet
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id, project_manager, path_id")
    .eq("id", projectId)
    .single();

  if (project?.owner_id === userId || project?.project_manager === userEmail) {
    return true;
  }

  // Si le projet n'a pas de path_id, pas d'accès via manager
  if (!project?.path_id) return false;

  // Récupérer le chemin hiérarchique du projet
  const { data: projectPath } = await supabase
    .from("hierarchy_paths")
    .select("path_string")
    .eq("id", project.path_id)
    .single();

  if (!projectPath) return false;

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

  if (!managerPaths || managerPaths.length === 0) return false;

  // Vérifier si l'un des chemins du manager est un préfixe du chemin du projet
  return managerPaths.some(mp => {
    const managerPathString = (mp.hierarchy_paths as any)?.path_string;
    if (!managerPathString) return false;
    // Le chemin du projet doit commencer par le chemin du manager
    return projectPath.path_string.startsWith(managerPathString);
  });
};
