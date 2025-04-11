
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatus, ProgressStatus } from "@/types/project";
import { statusIcons } from "@/lib/project-status";
import { Hourglass, Copy, Check, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ProjectSummaryHeaderProps {
  title: string;
  description?: string;
  project_manager?: string;
  id: string;
  isProjectManager: boolean;
  isAdmin: boolean;
  start_date?: string;
  end_date?: string;
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
  isProjectManager,
  isAdmin,
  start_date,
  end_date,
}: ProjectSummaryHeaderProps) => {
  const [copied, setCopied] = useState(false);

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

  const { data: projectCode } = useQuery({
    queryKey: ["projectCode", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_codes")
        .select("code")
        .eq("project_id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project code:", error);
        return null;
      }

      return data;
    },
    enabled: !!id,
  });
  
  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("for_entity_type, for_entity_id")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project:", error);
        return null;
      }

      return data;
    },
    enabled: !!id,
  });
  
  const { data: forEntityName } = useQuery({
    queryKey: ["forEntity", project?.for_entity_type, project?.for_entity_id],
    queryFn: async () => {
      if (!project?.for_entity_type || !project?.for_entity_id) {
        return null;
      }
      
      let data = null;
      let error = null;
      
      // Use separate queries based on entity type to satisfy TypeScript
      if (project.for_entity_type === "pole") {
        const result = await supabase
          .from("poles")
          .select("name")
          .eq("id", project.for_entity_id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      } 
      else if (project.for_entity_type === "direction") {
        const result = await supabase
          .from("directions")
          .select("name")
          .eq("id", project.for_entity_id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      } 
      else if (project.for_entity_type === "service") {
        const result = await supabase
          .from("services")
          .select("name")
          .eq("id", project.for_entity_id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }
        
      if (error || !data) {
        console.error(`Error fetching ${project.for_entity_type} name:`, error);
        return null;
      }
      
      return {
        type: project.for_entity_type,
        name: data.name
      };
    },
    enabled: !!project?.for_entity_type && !!project?.for_entity_id,
  });

  const { data: projectManagerProfile } = useQuery({
    queryKey: ["projectManagerProfile", project_manager],
    queryFn: async () => {
      if (!project_manager) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", project_manager)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project manager profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!project_manager,
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

  const getProjectManagerDisplay = () => {
    if (!project_manager) return "-";
    if (projectManagerProfile?.first_name && projectManagerProfile?.last_name) {
      return `${projectManagerProfile.first_name} ${projectManagerProfile.last_name}`;
    }
    return project_manager;
  };

  const copyCodeToClipboard = () => {
    if (projectCode?.code) {
      const formattedCode = `#${projectCode.code}#`;
      navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  const getProjectPeriod = () => {
    if (start_date && end_date) {
      return `${formatDate(start_date)} - ${formatDate(end_date)}`;
    } else if (start_date) {
      return `Depuis le ${formatDate(start_date)}`;
    } else if (end_date) {
      return `Jusqu'au ${formatDate(end_date)}`;
    }
    return "-";
  };
  
  const getForEntityTypeLabel = (type: string) => {
    switch (type) {
      case "pole":
        return "Pôle";
      case "direction":
        return "Direction";
      case "service":
        return "Service";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            {projectCode?.code && (
              <div className="flex items-center">
                <div className="bg-secondary/50 text-secondary-foreground px-2 py-1 rounded text-sm font-mono flex items-center gap-1.5">
                  {projectCode.code}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full"
                    onClick={copyCodeToClipboard}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Ce code unique permet d'identifier facilement ce projet. Vous pouvez l'utiliser pour référencer ce projet dans les événements de calendrier.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          
          {forEntityName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Projet réalisé pour :</span>
              <Badge variant="outline" className="text-sm">
                {getForEntityTypeLabel(forEntityName.type)} {forEntityName.name}
              </Badge>
            </div>
          )}
        </div>
        {getStatusIcon()}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Chef de projet</span>
            <p className="font-medium">{getProjectManagerDisplay()}</p>
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
            <span className="text-sm text-muted-foreground">Période</span>
            <p className="font-medium">{getProjectPeriod()}</p>
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
