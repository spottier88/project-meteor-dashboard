import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TaskList } from "@/components/TaskList";

interface KanbanBoardProps {
  projectId: string;
  readOnly?: boolean;
}

export const KanbanBoard = ({ projectId, readOnly = false }: KanbanBoardProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const { data: taskData } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (taskData) {
      setTasks(taskData);
    }
  }, [taskData]);

  const onAddTask = () => {
    setIsTaskFormOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {!readOnly && (
        <Button onClick={onAddTask} className="mb-4">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      )}
      {tasks.map(task => (
        <div key={task.id} className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">{task.title}</h3>
          <p>{task.description}</p>
        </div>
      ))}
    </div>
  );
};
