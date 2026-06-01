/**
 * Hook : récupère les statistiques d'usage via la fonction RPC
 * `get_admin_usage_stats`. Période obligatoire, filtres org optionnels.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageStats {
  active: { dau: number; wau: number; mau: number; total_active_accounts: number };
  events: Record<string, number>;
  daily_active: Array<{ day: string; active_users: number }>;
  daily_events: Array<{ day: string; event_type: string; count: number }>;
  top_users: Array<{ user_id: string; name: string; email: string; actions: number }>;
  top_projects: Array<{ project_id: string; title: string; events: number }>;
  inactive_accounts: number;
}

interface Args {
  startDate: string;
  endDate: string;
  poleId: string | null;
  directionId: string | null;
  serviceId: string | null;
}

export const useUsageStats = (args: Args) => {
  return useQuery({
    queryKey: ["admin-usage-stats", args],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_admin_usage_stats", {
        p_start: args.startDate,
        p_end: args.endDate,
        p_pole: args.poleId,
        p_direction: args.directionId,
        p_service: args.serviceId,
      });
      if (error) throw error;
      return data as UsageStats;
    },
  });
};
