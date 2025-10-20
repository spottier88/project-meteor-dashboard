/**
 * @file LinkedProjectsSection.tsx
 * @description Section affichant les projets liés dans la page de détails du projet maître
 * Permet de visualiser et de délier les projets liés (admin uniquement pour délier)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { useProjectLinks } from "@/hooks/useProjectLinks";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { lifecycleStatusLabels } from "@/types/project";

interface LinkedProjectsSectionProps {
  masterProjectId: string;
  isAdmin: boolean;
}

export const LinkedProjectsSection = ({
  masterProjectId,
  isAdmin,
}: LinkedProjectsSectionProps) => {
  const { linkedProjects, unlinkProject } = useProjectLinks(masterProjectId);
  const navigate = useNavigate();

  if (!linkedProjects || linkedProjects.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Projets liés ({linkedProjects.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {linkedProjects.map((project: any) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{project.title}</div>
                <div className="text-sm text-muted-foreground">
                  {project.description}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {lifecycleStatusLabels[project.lifecycle_status as keyof typeof lifecycleStatusLabels]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Chef de projet : {project.project_manager || "-"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}?fromMaster=true`)}
                >
                  Voir
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkProject.mutate(project.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
