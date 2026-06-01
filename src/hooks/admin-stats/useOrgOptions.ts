/**
 * Hook léger : charge la liste des pôles, directions et services
 * pour alimenter les filtres organisationnels des pages stats admin.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrgOption {
  id: string;
  name: string;
  pole_id?: string | null;
  direction_id?: string | null;
}

export const useOrgOptions = () => {
  return useQuery({
    queryKey: ["admin-stats-org-options"],
    queryFn: async () => {
      const [polesRes, dirRes, svcRes] = await Promise.all([
        supabase.from("poles").select("id, name").order("name"),
        supabase.from("directions").select("id, name, pole_id").order("name"),
        supabase.from("services").select("id, name, direction_id").order("name"),
      ]);
      if (polesRes.error) throw polesRes.error;
      if (dirRes.error) throw dirRes.error;
      if (svcRes.error) throw svcRes.error;
      return {
        poles: polesRes.data as OrgOption[],
        directions: dirRes.data as OrgOption[],
        services: svcRes.data as OrgOption[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
