import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProjectSummaryActionsProps {
  canManage: boolean;
  onAddTask: () => void;
}

export const ProjectSummaryActions = ({ canManage, onAddTask }: ProjectSummaryActionsProps) => {
  if (!canManage) return null;

  return (
    <div className="flex items-center justify-end">
      <Button onClick={onAddTask} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle tâche
      </Button>
    </div>
  );
};