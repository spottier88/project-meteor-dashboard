import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { statusIcons } from "@/lib/project-status";
import { Hourglass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectSummaryHeaderProps {
  title: string;
  description?: string;
  project_manager?: string;
  id: string;
}

const progressLabels = {
  better: "En amélioration",
  stable: "Stable",
  worse: "En dégradation",
} as const;

export const ProjectSummaryHeader = ({
  title,
  description,
  project_manager,
  id,
}: ProjectSummaryHeaderProps) => {
  const { data: latestReview } = useQuery({
    queryKey: ["latestReview", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("latest_reviews")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching latest review:", error);
        return null;
      }

      return data;
    },
    enabled: !!id,
  });

  const getStatusIcon = () => {
    const status = latestReview?.weather;
    if (!status || !statusIcons[status]) {
      return <Hourglass className="text-muted-foreground" aria-label="En attente" />;
    }
    const StatusIcon = statusIcons[status].icon;
    return (
      <StatusIcon
        className={statusIcons[status].color}
        aria-label={statusIcons[status].label}
      />
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {getStatusIcon()}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Chef de projet</span>
            <p className="font-medium">{project_manager || "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Avancement</span>
            <p className="font-medium">{latestReview?.completion || 0}%</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Progression</span>
            <p className="font-medium">
              {latestReview?.progress ? progressLabels[latestReview.progress] : "-"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Dernière revue</span>
            <p className="font-medium">
              {latestReview?.created_at 
                ? new Date(latestReview.created_at).toLocaleDateString("fr-FR")
                : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};