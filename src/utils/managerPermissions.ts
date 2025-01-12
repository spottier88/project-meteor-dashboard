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

  console.log("Manager assignments:", assignments);
  console.log("Project data:", projectData);

  if (!assignments || !projectData) return false;

  // Trier les affectations par niveau de précision (service > direction > pôle)
  const sortedAssignments = [...assignments].sort((a, b) => {
    // Service est prioritaire
    if (a.service_id && !b.service_id) return -1;
    if (!a.service_id && b.service_id) return 1;
    // Direction est ensuite prioritaire
    if (a.direction_id && !b.direction_id) return -1;
    if (!a.direction_id && b.direction_id) return 1;
    return 0;
  });

  console.log("Sorted assignments:", sortedAssignments);

  // Utiliser uniquement l'affectation la plus précise
  const mostPreciseAssignment = sortedAssignments[0];
  if (!mostPreciseAssignment) return false;

  console.log("Most precise assignment:", {
    assignment: mostPreciseAssignment,
    level: mostPreciseAssignment.service_id ? 'service' : 
           mostPreciseAssignment.direction_id ? 'direction' : 
           mostPreciseAssignment.pole_id ? 'pole' : 'none'
  });

  // Vérifier l'accès basé sur le niveau le plus précis uniquement
  if (mostPreciseAssignment.service_id) {
    console.log("Checking service level access:", {
      assignedService: mostPreciseAssignment.service_id,
      projectService: projectData.service_id,
      hasAccess: mostPreciseAssignment.service_id === projectData.service_id
    });
    return mostPreciseAssignment.service_id === projectData.service_id;
  }

  if (mostPreciseAssignment.direction_id) {
    console.log("Checking direction level access:", {
      assignedDirection: mostPreciseAssignment.direction_id,
      projectDirection: projectData.direction_id,
      hasAccess: mostPreciseAssignment.direction_id === projectData.direction_id
    });
    return mostPreciseAssignment.direction_id === projectData.direction_id;
  }

  if (mostPreciseAssignment.pole_id) {
    console.log("Checking pole level access:", {
      assignedPole: mostPreciseAssignment.pole_id,
      projectPole: projectData.pole_id,
      hasAccess: mostPreciseAssignment.pole_id === projectData.pole_id
    });
    return mostPreciseAssignment.pole_id === projectData.pole_id;
  }

  return false;
};