import { Card, CardContent } from "./ui/card";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{project.title}</h1>
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