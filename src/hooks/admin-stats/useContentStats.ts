/**
 * Hook : récupère les statistiques de contenu via la fonction RPC
 * `get_admin_content_stats`. Filtres optionnels : pôle / direction / service.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContentStats {
  projects: {
    total: number;
    in_progress: number;
    completed: number;
    study: number;
    validated: number;
    suspended: number;
    innovative: number;
  };
  weather: { sunny: number; cloudy: number; stormy: number; unknown: number; avg_completion: number };
  by_pole: Array<{ name: string; count: number }>;
  by_direction: Array<{ name: string; count: number }>;
  missing_reviews: number;
  tasks: { total: number; done: number; overdue: number };
  risks: { total: number; open_count: number; critical: number };
  reviews: { total: number; projects_reviewed: number };
  org: { poles: number; directions: number; services: number; active_users: number; inactive_users: number };
  roles: Array<{ role: string; count: number }>;
  top_pms: Array<{ email: string; name: string; count: number }>;
}

interface Args {
  poleId: string | null;
  directionId: string | null;
  serviceId: string | null;
}

export const useContentStats = (args: Args) => {
  return useQuery({
    queryKey: ["admin-content-stats", args],
    queryFn: async () => {
      // RPC non typé dans types.ts : cast nécessaire.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_admin_content_stats", {
        p_pole: args.poleId,
        p_direction: args.directionId,
        p_service: args.serviceId,
      });
      if (error) throw error;
      return data as ContentStats;
    },
  });
};
