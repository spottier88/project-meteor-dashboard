import { Task, Column } from "./types";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  projectOwnerId?: string;
  projectManagerEmail?: string;
}

export const KanbanColumn = ({
  column,
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  projectOwnerId,
  projectManagerEmail,
}: KanbanColumnProps) => {
  return (
    <div key={column.id} className="space-y-4">
      <h3 className="font-semibold text-lg">{column.title}</h3>
      <div className="space-y-2">
        {tasks
          .filter((task) => task.status === column.id)
          .map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              projectOwnerId={projectOwnerId}
              projectManagerEmail={projectManagerEmail}
            />
          ))}
      </div>
    </div>
  );
};