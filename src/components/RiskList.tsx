import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export interface RiskListProps {
  projectId: string;
  projectTitle: string;
  canEdit: boolean;
  isProjectManager: boolean;
  isAdmin: boolean;
}

export const RiskList = ({
  projectId,
  projectTitle,
  canEdit,
  isProjectManager,
  isAdmin,
}: RiskListProps) => {
  const { data: risks, isLoading, isError } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risks")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading risks.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Risks for {projectTitle}</h2>
      {risks && risks.length > 0 ? (
        <ul>
          {risks.map((risk) => (
            <li key={risk.id} className="mb-2">
              <div className="flex justify-between">
                <span>{risk.description}</span>
                {canEdit && (
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No risks found for this project.</p>
      )}
    </div>
  );
};
