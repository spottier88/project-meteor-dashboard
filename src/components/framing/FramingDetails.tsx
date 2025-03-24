
/**
 * @component FramingDetails
 * @description Affichage du document de cadrage d'un projet.
 * Présente les différentes sections du cadrage (contexte, parties prenantes,
 * gouvernance, objectifs, calendrier, livrables) et permet leur édition
 * si l'utilisateur en a les droits.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { FramingSectionEditor } from "./FramingSectionEditor";
import { useProjectPermissions } from "@/hooks/use-project-permissions";

interface FramingDetailsProps {
  projectId: string;
}

type SectionKey = "context" | "stakeholders" | "governance" | "objectives" | "timeline" | "deliverables";

interface Section {
  title: string;
  key: SectionKey;
}

export const FramingDetails = ({ projectId }: FramingDetailsProps) => {
  const { canEdit } = useProjectPermissions(projectId);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);

  const { data: framing, isLoading } = useQuery({
    queryKey: ["project-framing", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_framing")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project framing:", error);
        throw error;
      }

      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sections: Section[] = [
    { title: "Contexte", key: "context" },
    { title: "Parties prenantes", key: "stakeholders" },
    { title: "Gouvernance", key: "governance" },
    { title: "Objectifs", key: "objectives" },
    { title: "Calendrier", key: "timeline" },
    { title: "Livrables", key: "deliverables" },
  ];

  if (!framing && !canEdit) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Aucun élément de cadrage n'a été défini pour ce projet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.key} className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">{section.title}</CardTitle>
            {canEdit && editingSection !== section.key && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingSection(section.key)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingSection === section.key ? (
              <FramingSectionEditor
                projectId={projectId}
                sectionTitle={section.title}
                sectionKey={section.key}
                content={framing?.[section.key] || ""}
                onCancel={() => setEditingSection(null)}
              />
            ) : framing?.[section.key] ? (
              <div className="whitespace-pre-wrap">{framing[section.key]}</div>
            ) : (
              <p className="text-muted-foreground italic">
                {canEdit 
                  ? "Cliquez sur le bouton d'édition pour définir cette section"
                  : "Aucune information définie"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
