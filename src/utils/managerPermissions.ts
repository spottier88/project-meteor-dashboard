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
    .select("pole_id, direction_id, service_id")
    .eq("user_id", userId);

  const { data: projectData } = await supabase
    .from("projects")
    .select("pole_id, direction_id, service_id")
    .eq("id", projectId)
    .single();

  console.log("Manager assignments:", assignments);
  console.log("Project data:", projectData);

  if (!assignments || !projectData) return false;

  // Vérifier les droits basés sur la hiérarchie
  return assignments.some(assignment => {
    // Si le manager a une affectation service, il ne voit que les projets de ce service
    if (assignment.service_id) {
      console.log("Checking service level access:", {
        assignedService: assignment.service_id,
        projectService: projectData.service_id
      });
      return assignment.service_id === projectData.service_id;
    }
    
    // Si le manager a une affectation direction, il voit les projets de la direction
    // et de ses services
    if (assignment.direction_id) {
      console.log("Checking direction level access:", {
        assignedDirection: assignment.direction_id,
        projectDirection: projectData.direction_id
      });
      return assignment.direction_id === projectData.direction_id;
    }
    
    // Si le manager a une affectation pôle, il voit les projets du pôle
    // et de ses directions/services
    if (assignment.pole_id) {
      console.log("Checking pole level access:", {
        assignedPole: assignment.pole_id,
        projectPole: projectData.pole_id
      });
      return assignment.pole_id === projectData.pole_id;
    }

    return false;
  });
};