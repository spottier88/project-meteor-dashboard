import { supabase } from "@/integrations/supabase/client";

interface ProjectData {
  id: string;
  pole_id: string | null;
  direction_id: string | null;
  service_id: string | null;
}

interface Assignment {
  pole_id: string | null;
  direction_id: string | null;
  service_id: string | null;
  poles?: { name: string } | null;
  directions?: { name: string } | null;
  services?: { name: string } | null;
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
    .select("pole_id, direction_id, service_id, poles(name), directions(name), services(name)")
    .eq("user_id", userId);

  const { data: projectData } = await supabase
    .from("projects")
    .select("pole_id, direction_id, service_id")
    .eq("id", projectId)
    .single();

  console.log("Checking access for project:", projectId);
  console.log("Project data:", projectData);
  console.log("User assignments:", assignments);

  if (!assignments || !projectData) return false;

  // Pour chaque affectation, vérifier si elle donne accès au projet
  return assignments.some(assignment => {
    // Vérifier d'abord au niveau service si une affectation service existe
    if (assignment.service_id && projectData.service_id) {
      const hasServiceAccess = assignment.service_id === projectData.service_id;
      console.log("Checking service level access:", {
        assignedService: assignment.service_id,
        projectService: projectData.service_id,
        serviceName: assignment.services?.name,
        hasAccess: hasServiceAccess
      });
      if (hasServiceAccess) return true;
    }

    // Vérifier au niveau direction si une affectation direction existe
    if (assignment.direction_id && projectData.direction_id) {
      const hasDirectionAccess = assignment.direction_id === projectData.direction_id;
      console.log("Checking direction level access:", {
        assignedDirection: assignment.direction_id,
        projectDirection: projectData.direction_id,
        directionName: assignment.directions?.name,
        hasAccess: hasDirectionAccess
      });
      if (hasDirectionAccess) return true;
    }

    // Vérifier au niveau pôle si une affectation pôle existe
    if (assignment.pole_id && projectData.pole_id) {
      const hasPoleAccess = assignment.pole_id === projectData.pole_id;
      console.log("Checking pole level access:", {
        assignedPole: assignment.pole_id,
        projectPole: projectData.pole_id,
        poleName: assignment.poles?.name,
        hasAccess: hasPoleAccess
      });
      if (hasPoleAccess) return true;
    }

    return false;
  });
};