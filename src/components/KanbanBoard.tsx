import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  due_date?: string;
  assignee?: string;
}

interface KanbanBoardProps {
  projectId: string;
}

const columns = [
  { id: "todo", title: "À faire" },
  { id: "in_progress", title: "En cours" },
  { id: "done", title: "Terminé" },
];

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const { toast } = useToast();

  const { data: tasks, refetch } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      refetch();
      toast({
        title: "Succès",
        description: "Le statut de la tâche a été mis à jour",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => (
        <div key={column.id} className="space-y-4">
          <h3 className="font-semibold text-lg">{column.title}</h3>
          <div className="space-y-2">
            {tasks
              ?.filter((task) => task.status === column.id)
              .map((task) => (
                <Card key={task.id} className="bg-card">
                  <CardContent className="p-4 space-y-2">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {task.assignee || "Non assigné"}
                      </div>
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">À faire</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="done">Terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};