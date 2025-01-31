import { CardHeader } from "@/components/ui/card";
import { ProjectActions } from "../ProjectActions";
import { StatusIcon } from "./StatusIcon";
import { ProjectStatus } from "@/types/project";

interface ProjectCardHeaderProps {
  title: string;
  status: ProjectStatus | null;
  onEdit: (id: string) => void;
  onViewHistory: (id: string, title: string) => void;
  id: string;
  canEdit?: boolean;
  isMember?: boolean;
  additionalActions?: React.ReactNode;
}

export const ProjectCardHeader = ({
  title,
  status,
  onEdit,
  onViewHistory,
  id,
  canEdit,
  isMember,
  additionalActions,
}: ProjectCardHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center space-x-2">
        <StatusIcon status={status} />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="flex items-center space-x-2">
        {additionalActions}
        <ProjectActions
          projectId={id}
          projectTitle={title}
          onEdit={onEdit}
          onViewHistory={onViewHistory}
          canEdit={canEdit}
          isMember={isMember}
        />
      </div>
    </CardHeader>
  );
};