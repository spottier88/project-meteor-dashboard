import { supabase } from "@/integrations/supabase/client";

interface ProjectData {
  id: string;
  pole_id: string | null;
  direction_id: string | null;
  service_id: string | null;
}

export const canManagerAccessProject = async (
  userId: string | undefined,
  projectId: string,
  userEmail?: string | null
): Promise<boolean> => {
  if (!userId) return false;

  // Vérifier si l'utilisateur est admin ou chef de projet
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (userRoles?.some(ur => ur.role === "admin")) return true;

  // Vérifier si l'utilisateur est le propriétaire ou le chef de projet
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id, project_manager")
    .eq("id", projectId)
    .single();

  if (project?.owner_id === userId || project?.project_manager === userEmail) {
    return true;
  }

  // Récupérer les affectations du manager et les informations du projet
  const { data: assignments } = await supabase
    .from("manager_assignments")
    .select("entity_id, entity_type")
    .eq("user_id", userId);

  const { data: projectData } = await supabase
    .from("projects")
    .select("pole_id, direction_id, service_id")
    .eq("id", projectId)
    .single();

  // console.log("Checking access for project:", projectId);
  // console.log("Project data:", projectData);
  // console.log("User assignments:", assignments);

  if (!assignments || !projectData) return false;

  // Pour chaque affectation, vérifier si elle donne accès au projet
  return assignments.some(assignment => {
    switch (assignment.entity_type) {
      case 'service':
        return assignment.entity_id === projectData.service_id;
      case 'direction':
        return assignment.entity_id === projectData.direction_id;
      case 'pole':
        return assignment.entity_id === projectData.pole_id;
      default:
        return false;
    }
  });
};
