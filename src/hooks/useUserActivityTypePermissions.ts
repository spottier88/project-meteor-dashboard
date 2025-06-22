
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface ActivityTypePermission {
  activity_type_code: string;
  entity_type: string;
  entity_id: string;
}

export const useUserActivityTypePermissions = () => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ["user-activity-type-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Récupérer toutes les permissions de types d'activité
      const { data: allPermissions, error: permissionsError } = await supabase
        .from("activity_type_permissions")
        .select("*");

      if (permissionsError) {
        console.error("Erreur lors de la récupération des permissions:", permissionsError);
        throw permissionsError;
      }

      // Récupérer les affectations hiérarchiques de l'utilisateur
      const { data: userAssignments, error: assignmentsError } = await supabase
        .from("user_hierarchy_assignments")
        .select("entity_type, entity_id")
        .eq("user_id", user.id);

      if (assignmentsError) {
        console.error("Erreur lors de la récupération des affectations:", assignmentsError);
        throw assignmentsError;
      }

      // Filtrer les permissions selon les affectations de l'utilisateur
      const userPermissions = allPermissions.filter(permission => 
        userAssignments.some(assignment => 
          assignment.entity_type === permission.entity_type && 
          assignment.entity_id === permission.entity_id
        )
      );

      return userPermissions.map(p => p.activity_type_code);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
