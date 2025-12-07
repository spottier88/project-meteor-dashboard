
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook personnalisé pour récupérer les données nécessaires au formulaire de tâche
 */
export const useTaskFormData = (projectId: string, isOpen: boolean, taskId?: string) => {
  // Récupérer les informations du projet pour le chef de projet
  const { data: project, isSuccess: projectLoaded } = useQuery({
    queryKey: ["project-for-task", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId && isOpen,
  });

  // Fetch project members
  const { data: projectMembers } = useQuery({
    queryKey: ["projectMembers", projectId, project?.project_manager],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      
      let membersList = [...data];
      
      // Vérifier si le chef de projet est déjà dans la liste des membres
      if (project?.project_manager) {
        const projectManagerExists = membersList.some(member => 
          member.profiles?.email === project.project_manager
        );
        
        // Si le chef de projet n'est pas dans la liste, le récupérer et l'ajouter
        if (!projectManagerExists) {
          // console.log("Adding project manager to members list");
          const { data: pmProfile, error: pmError } = await supabase
            .from("profiles")
            .select("id, email, first_name, last_name")
            .eq("email", project.project_manager)
            .maybeSingle();
            
          if (!pmError && pmProfile) {
            membersList.push({
              user_id: pmProfile.id,
              profiles: pmProfile
            });
          }
        }
      }
      
      return membersList;
    },
    enabled: !!projectId && isOpen && projectLoaded,
  });

  // Fetch parent task options - Exclure la tâche actuelle et ses sous-tâches
  const { data: projectTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks-for-parent", projectId, taskId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Récupérer d'abord toutes les tâches de premier niveau
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, parent_task_id")
        .eq("project_id", projectId)
        .is("parent_task_id", null);

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      
      // Si une tâche est en cours d'édition, récupérer toutes ses sous-tâches pour les exclure aussi
      let subTaskIds: string[] = [];
      if (taskId) {
        const { data: childTasks, error: childError } = await supabase
          .from("tasks")
          .select("id")
          .eq("parent_task_id", taskId);
          
        if (!childError && childTasks) {
          subTaskIds = childTasks.map(t => t.id);
        }
      }
      
      // Filtrer pour exclure la tâche actuelle et ses sous-tâches
      const filteredTasks = data.filter(t => {
        // Exclure la tâche elle-même
        if (t.id === taskId) return false;
        // Exclure les sous-tâches de la tâche actuelle
        if (subTaskIds.includes(t.id)) return false;
        return true;
      });
      
      return filteredTasks;
    },
    enabled: !!projectId && isOpen,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  return {
    project,
    projectLoaded,
    projectMembers,
    projectTasks,
    tasksLoading
  };
};
