
/**
 * @hook useUserProjectMemberships
 * @description Hook pour récupérer les IDs de projets où l'utilisateur est membre explicite.
 * Utilisé pour distinguer les projets accessibles via adhésion explicite vs droits hiérarchiques.
 */

import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserProjectMemberships = () => {
  const user = useUser();

  return useQuery({
    queryKey: ["userProjectMemberships", user?.id],
    queryFn: async (): Promise<Set<string>> => {
      if (!user?.id) return new Set();

      const { data, error } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur lors de la récupération des adhésions:", error);
        return new Set();
      }

      return new Set(data?.map((m) => m.project_id) || []);
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
};
