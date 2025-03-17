
import { Card, CardContent } from "./ui/card";
import { Database } from "@/integrations/supabase/types";
import { LifecycleStatusBadge } from "./project/LifecycleStatusBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Copy, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const copyCodeToClipboard = () => {
    if (projectCode?.code) {
      const formattedCode = `#${projectCode.code}#`;
      navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Chef de projet</span>
              <p className="text-sm font-medium">{project.project_manager || "-"}</p>
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
