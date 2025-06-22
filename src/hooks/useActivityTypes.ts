
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { ActivityType } from "@/types/activity";

export const useActivityTypes = (includeInactive: boolean = false, checkPermissions: boolean = false) => {
  const { user } = useAuthContext();
  
  return useQuery<ActivityType[]>({
    queryKey: ["activity-types", user?.id, includeInactive, checkPermissions],
    queryFn: async () => {
      let query = supabase
        .from("activity_types")
        .select("*")
        .order("display_order", { ascending: true })
        .order("label");
      
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erreur lors de la récupération des types d'activité:", error);
        throw error;
      }
      
      // Si on doit vérifier les permissions, filtrer selon les droits de l'utilisateur
      if (checkPermissions && user?.id) {
        // Récupérer les permissions de l'utilisateur
        const { data: userAssignments, error: assignmentsError } = await supabase
          .from("user_hierarchy_assignments")
          .select("entity_type, entity_id")
          .eq("user_id", user.id);

        if (assignmentsError) {
          console.error("Erreur lors de la récupération des affectations:", assignmentsError);
          // En cas d'erreur, retourner tous les types (fallback)
          return data?.map(type => ({
            id: type.id,
            code: type.code,
            label: type.label,
            color: type.color || '#808080',
            is_active: type.is_active,
            display_order: type.display_order || 0
          })) || [];
        }

        // Récupérer toutes les permissions de types d'activité
        const { data: allPermissions, error: permissionsError } = await supabase
          .from("activity_type_permissions")
          .select("*");

        if (permissionsError) {
          console.error("Erreur lors de la récupération des permissions:", permissionsError);
          // En cas d'erreur, retourner tous les types (fallback)
          return data?.map(type => ({
            id: type.id,
            code: type.code,
            label: type.label,
            color: type.color || '#808080',
            is_active: type.is_active,
            display_order: type.display_order || 0
          })) || [];
        }

        // Filtrer les permissions selon les affectations de l'utilisateur
        const userPermissions = allPermissions?.filter(permission => 
          userAssignments?.some(assignment => 
            assignment.entity_type === permission.entity_type && 
            assignment.entity_id === permission.entity_id
          )
        ) || [];

        const allowedTypeCodes = userPermissions.map(p => p.activity_type_code);
        
        // Filtrer les types d'activité selon les permissions
        const filteredData = data?.filter(type => 
          allowedTypeCodes.includes(type.code)
        ) || [];
        
        return filteredData.map(type => ({
          id: type.id,
          code: type.code,
          label: type.label,
          color: type.color || '#808080',
          is_active: type.is_active,
          display_order: type.display_order || 0
        }));
      }
      
      // Transformer les données pour correspondre au type ActivityType
      return data?.map(type => ({
        id: type.id,
        code: type.code,
        label: type.label,
        color: type.color || '#808080',
        is_active: type.is_active,
        display_order: type.display_order || 0
      })) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
