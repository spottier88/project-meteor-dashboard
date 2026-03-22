
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Globe } from "lucide-react";

interface TemplateVisibilityBadgesProps {
  templateId: string;
}

/**
 * Affiche les badges des entités organisationnelles affectées à un modèle.
 * Si aucune affectation, affiche "Tous".
 */
export const TemplateVisibilityBadges = ({ templateId }: TemplateVisibilityBadgesProps) => {
  const { data: assignments = [] } = useQuery({
    queryKey: ["templateVisibility", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_template_visibility")
        .select("entity_type, entity_id")
        .eq("template_id", templateId);
      if (error) throw error;
      return data;
    },
  });

  // Charger les noms des entités
  const { data: entityNames = {} } = useQuery({
    queryKey: ["templateVisibilityNames", templateId, assignments],
    queryFn: async () => {
      const names: Record<string, string> = {};
      for (const a of assignments) {
        const table =
          a.entity_type === "pole" ? "poles" : a.entity_type === "direction" ? "directions" : "services";
        const { data } = await supabase.from(table).select("name").eq("id", a.entity_id).single();
        if (data) names[`${a.entity_type}-${a.entity_id}`] = data.name;
      }
      return names;
    },
    enabled: assignments.length > 0,
  });

  if (assignments.length === 0) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Globe className="h-3 w-3" />
        Tous
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {assignments.map((a) => (
        <Badge key={`${a.entity_type}-${a.entity_id}`} variant="secondary" className="text-xs">
          {entityNames[`${a.entity_type}-${a.entity_id}`] || "..."}
        </Badge>
      ))}
    </div>
  );
};
