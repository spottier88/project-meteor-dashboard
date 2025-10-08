import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";

/**
 * Hook pour récupérer les projets de l'utilisateur
 * Retourne les projets où l'utilisateur est chef de projet OU membre
 */
export const useUserProjects = () => {
  const session = useSession();

  return useQuery({
    queryKey: ["userProjects", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      // Récupérer tous les projets accessibles via la fonction RPC
      const { data, error } = await supabase
        .rpc("get_accessible_projects_list_view_with_admin_mode", {
          p_user_id: session.user.id,
          p_admin_mode_disabled: false,
        });

      if (error) throw error;

      // Filtrer pour ne garder que les projets où l'utilisateur est chef de projet ou membre
      const projectsData = (data || []) as any[];
      
      // Récupérer les projets où l'utilisateur est membre
      const { data: memberProjects, error: memberError } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", session.user.id);

      if (memberError) throw memberError;

      const memberProjectIds = new Set(memberProjects?.map(pm => pm.project_id) || []);

      // Filtrer les projets
      const userProjects = projectsData.filter((project: any) => {
        // Chef de projet
        const isProjectManager = project.project_manager_id === session.user.id;
        // Membre du projet
        const isMember = memberProjectIds.has(project.id);
        
        return isProjectManager || isMember;
      });

      // Mapper au format attendu
      return userProjects.map((project: any) => ({
        id: project.id,
        title: project.title,
        pole_id: project.pole_id,
        pole_name: project.pole_name,
        direction_id: project.direction_id,
        direction_name: project.direction_name,
        service_id: project.service_id,
        service_name: project.service_name,
      }));
    },
    enabled: !!session?.user?.id,
  });
};
