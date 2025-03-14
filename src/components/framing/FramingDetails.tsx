
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FramingDetailsProps {
  projectId: string;
}

export const FramingDetails = ({ projectId }: FramingDetailsProps) => {
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

  if (!framing) {
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

  const sections = [
    { title: "Contexte", content: framing.context },
    { title: "Parties prenantes", content: framing.stakeholders },
    { title: "Gouvernance", content: framing.governance },
    { title: "Objectifs", content: framing.objectives },
    { title: "Calendrier", content: framing.timeline },
    { title: "Livrables", content: framing.deliverables },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {section.content ? (
              <div className="whitespace-pre-wrap">{section.content}</div>
            ) : (
              <p className="text-muted-foreground italic">
                Aucune information définie
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
