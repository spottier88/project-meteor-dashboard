import { Shield, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MonitoringLevel } from "@/types/monitoring";

interface MonitoringBadgeProps {
  projectId: string;
  className?: string;
}

interface MonitoringData {
  monitoring_level: MonitoringLevel;
  monitoring_entity_id: string | null;
  entityName?: string | null;
}

export const MonitoringBadge = ({ projectId, className }: MonitoringBadgeProps) => {
  const { data: monitoring } = useQuery({
    queryKey: ["project-monitoring", projectId],
    queryFn: async () => {
      const { data: monitoringData, error: monitoringError } = await supabase
        .from("project_monitoring")
        .select("monitoring_level, monitoring_entity_id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (monitoringError) throw monitoringError;
      if (!monitoringData) return null;

      const result: MonitoringData = {
        monitoring_level: monitoringData.monitoring_level,
        monitoring_entity_id: monitoringData.monitoring_entity_id,
      };

      if (monitoringData.monitoring_level === "pole" && monitoringData.monitoring_entity_id) {
        const { data: poleData } = await supabase
          .from("poles")
          .select("name")
          .eq("id", monitoringData.monitoring_entity_id)
          .single();
        result.entityName = poleData?.name;
      }

      if (monitoringData.monitoring_level === "direction" && monitoringData.monitoring_entity_id) {
        const { data: directionData } = await supabase
          .from("directions")
          .select("name")
          .eq("id", monitoringData.monitoring_entity_id)
          .single();
        result.entityName = directionData?.name;
      }

      return result;
    },
  });

  if (!monitoring || monitoring.monitoring_level === "none") {
    return null;
  }


  // contenu texte du badge
  // Suivi Pôle {monitoring.entityName ? `(${monitoring.entityName})` : ""}
  
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
            Suivi Pôle
          </>
        );
      case "direction":
        return (
          <>
            <Flag className="h-4 w-4 mr-1" />
            Suivi Direction
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
