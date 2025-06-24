
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { ActivityType } from "@/types/activity";

export const useActivityTypes = (includeInactive: boolean = false, checkPermissions: boolean = false) => {
  const { user } = useAuthContext();
  
  return useQuery<ActivityType[]>({
    queryKey: ["activity-types", user?.id, includeInactive, checkPermissions],
    queryFn: async () => {
      console.log("[useActivityTypes] Début de la récupération des types d'activité", {
        userId: user?.id,
        includeInactive,
        checkPermissions
      });

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

      console.log(`[useActivityTypes] Types d'activité récupérés: ${data?.length || 0}`);
      
      // Si on doit vérifier les permissions et que l'utilisateur est connecté
      if (checkPermissions && user?.id) {
        console.log("[useActivityTypes] Vérification des permissions pour l'utilisateur:", user.id);
        
        // Filtrer les types d'activité selon les permissions via la fonction RPC
        const filteredData = [];
        
        for (const type of data || []) {
          console.log(`[useActivityTypes] Vérification des permissions pour le type: ${type.code}`);
          
          // Utiliser la fonction RPC can_use_activity_type pour vérifier les permissions
          const { data: canUse, error: permissionError } = await supabase
            .rpc('can_use_activity_type', {
              p_user_id: user.id,
              p_activity_type_code: type.code
            });

          if (permissionError) {
            console.error(`[useActivityTypes] Erreur lors de la vérification des permissions pour ${type.code}:`, permissionError);
            // En cas d'erreur, on inclut le type par défaut pour éviter de bloquer l'utilisateur
            filteredData.push(type);
          } else if (canUse) {
            console.log(`[useActivityTypes] Permission accordée pour le type: ${type.code}`);
            filteredData.push(type);
          } else {
            console.log(`[useActivityTypes] Permission refusée pour le type: ${type.code}`);
          }
        }
        
        console.log(`[useActivityTypes] Types d'activité autorisés: ${filteredData.length}`);
        
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
      const result = data?.map(type => ({
        id: type.id,
        code: type.code,
        label: type.label,
        color: type.color || '#808080',
        is_active: type.is_active,
        display_order: type.display_order || 0
      })) || [];

      console.log(`[useActivityTypes] Types d'activité retournés: ${result.length}`);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
