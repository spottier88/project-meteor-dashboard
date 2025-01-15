import { Shield, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MonitoringLevel } from "@/types/monitoring";

interface MonitoringBadgeProps {
  projectId: string;
  className?: string;
}

export const MonitoringBadge = ({ projectId, className }: MonitoringBadgeProps) => {
  const { data: monitoring } = useQuery({
    queryKey: ["project-monitoring", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_monitoring")
        .select(`
          *,
          poles:monitoring_entity_id (name),
          directions:monitoring_entity_id (name)
        `)
        .eq("project_id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (!monitoring || monitoring.monitoring_level === "none") {
    return null;
  }

  const getBadgeContent = () => {
    switch (monitoring.monitoring_level) {
      case "dgs":
        return (
          <>
            <Shield className="h-4 w-4 mr-1" />
            Suivi DGS
          </>
        );
      case "pole":
        return (
          <>
            <Flag className="h-4 w-4 mr-1" />
            Suivi {monitoring.poles?.name}
          </>
        );
      case "direction":
        return (
          <>
            <Flag className="h-4 w-4 mr-1" />
            Suivi {monitoring.directions?.name}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Badge variant="secondary" className={className}>
      {getBadgeContent()}
    </Badge>
  );
};