
import { Card, CardContent } from "./ui/card";
import { Database } from "@/integrations/supabase/types";
import { LifecycleStatusBadge } from "./project/LifecycleStatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Copy, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "./ui/badge";
import { ForEntityType } from "@/types/project";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const { data: projectCode } = useQuery({
    queryKey: ["projectCode", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_codes")
        .select("code")
        .eq("project_id", project.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project code:", error);
        return null;
      }

      return data;
    },
    enabled: !!project.id,
  });

  // Récupération du profil du chef de projet pour afficher son nom
  const { data: projectManagerProfile } = useQuery({
    queryKey: ["projectManagerProfile", project.project_manager],
    queryFn: async () => {
      if (!project.project_manager) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("email", project.project_manager)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!project.project_manager,
  });
  
  const { data: forEntityName } = useQuery({
    queryKey: ["forEntity", project.for_entity_type, project.for_entity_id],
    queryFn: async () => {
      if (!project.for_entity_type || !project.for_entity_id) {
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
    enabled: !!project.for_entity_type && !!project.for_entity_id,
  });

  const copyCodeToClipboard = () => {
    if (projectCode?.code) {
      const formattedCode = `#${projectCode.code}#`;
      navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fonction helper pour afficher le nom du chef de projet
  const getProjectManagerDisplay = () => {
    if (!project.project_manager) return "-";
    if (projectManagerProfile?.first_name && projectManagerProfile?.last_name) {
      return `${projectManagerProfile.first_name} ${projectManagerProfile.last_name}`;
    }
    return project.project_manager;
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
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <LifecycleStatusBadge status={project.lifecycle_status} />
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
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
          
          {forEntityName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Projet réalisé pour :</span>
              <Badge variant="outline" className="text-sm">
                {getForEntityTypeLabel(forEntityName.type)} {forEntityName.name}
              </Badge>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Chef de projet</span>
              <p className="text-sm font-medium">{getProjectManagerDisplay()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Date de début</span>
              <p className="text-sm font-medium">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString("fr-FR")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Date de fin</span>
              <p className="text-sm font-medium">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString("fr-FR")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Priorité</span>
              <p className="text-sm font-medium">{project.priority || "-"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
