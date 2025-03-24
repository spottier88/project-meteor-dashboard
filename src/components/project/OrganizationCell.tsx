/**
 * @component OrganizationCell
 * @description Cellule affichant l'organisation (pôle, direction, service) d'un projet.
 * Récupère les données d'organisation depuis la base de données et les affiche
 * de manière formatée. Utilisé principalement dans les vues tabulaires des projets.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrganizationCellProps {
  poleId?: string;
  directionId?: string;
  serviceId?: string;
}

export const OrganizationCell = ({ poleId, directionId, serviceId }: OrganizationCellProps) => {
  const { data: organization } = useQuery({
    queryKey: ["organization", poleId, directionId, serviceId],
    queryFn: async () => {
      let org = { name: "", level: "" };

      if (serviceId) {
        const { data } = await supabase
          .from("services")
          .select("name")
          .eq("id", serviceId)
          .single();
        if (data) {
          org = { name: data.name, level: "Service" };
        }
      } else if (directionId) {
        const { data } = await supabase
          .from("directions")
          .select("name")
          .eq("id", directionId)
          .single();
        if (data) {
          org = { name: data.name, level: "Direction" };
        }
      } else if (poleId) {
        const { data } = await supabase
          .from("poles")
          .select("name")
          .eq("id", poleId)
          .single();
        if (data) {
          org = { name: data.name, level: "Pôle" };
        }
      }

      return org;
    },
    enabled: !!(poleId || directionId || serviceId),
  });

  if (!organization?.name) return <span className="text-muted-foreground">-</span>;

  return (
    <span>
      {organization.level}: {organization.name}
    </span>
  );
};
