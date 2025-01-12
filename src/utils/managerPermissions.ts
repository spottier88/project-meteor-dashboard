import { supabase } from "@/integrations/supabase/client";

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

  // Vérifier les droits de manager basés sur la hiérarchie
  const { data: assignments } = await supabase
    .from("manager_assignments")
    .select(`
      pole_id,
      direction_id,
      service_id,
      projects!inner (
        id,
        pole_id,
        direction_id,
        service_id
      )
    `)
    .eq("user_id", userId)
    .eq("projects.id", projectId);

  return assignments?.some(assignment => {
    const project = assignment.projects;
    return (
      (assignment.pole_id && project.pole_id === assignment.pole_id) ||
      (assignment.direction_id && project.direction_id === assignment.direction_id) ||
      (assignment.service_id && project.service_id === assignment.service_id)
    );
  }) || false;
};