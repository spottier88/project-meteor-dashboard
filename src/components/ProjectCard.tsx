import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { canManageProjectItems } from "@/utils/permissions";

interface ProjectCardProps {
  id: string;
  title: string;
  status: string;
  progress: string;
  completion: number;
  project_manager?: string;
  last_review_date?: string;
  onReview: (id: string) => void;
  onEdit: (id: string) => void;
  onViewHistory: (id: string) => void;
  owner_id?: string;
}

export const ProjectCard = ({
  id,
  title,
  status,
  progress,
  completion,
  project_manager,
  last_review_date,
  onReview,
  onEdit,
  onViewHistory,
  owner_id,
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const user = useUser();
  
  const handleTeamManagementClick = () => {
    navigate(`/projects/${id}/team`);
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p>Status: {status}</p>
        <p>Progress: {progress}</p>
        <p>Completion: {completion}%</p>
        <p>Project Manager: {project_manager || "-"}</p>
        <p>Last Review Date: {last_review_date ? new Date(last_review_date).toLocaleDateString("fr-FR") : "-"}</p>
      </CardHeader>
      <CardContent>
        <div className="absolute top-4 right-4 flex gap-2">
          {canManageProjectItems(user?.roles, user?.id, owner_id, project_manager, user?.email) && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTeamManagementClick}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
