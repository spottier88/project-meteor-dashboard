import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TaskSummaryProps {
  projectId: string;
}

export const TaskSummary = ({ projectId }: TaskSummaryProps) => {
  const navigate = useNavigate();
  const { data: taskCounts } = useQuery({
    queryKey: ["taskCounts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("project_id", projectId);

      if (error) throw error;

      const counts = {
        todo: 0,
        in_progress: 0,
        done: 0,
      };

      data.forEach((task) => {
        counts[task.status]++;
      });

      return counts;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-yellow-50">
          À faire : {taskCounts?.todo || 0}
        </Badge>
        <Badge variant="outline" className="bg-blue-50">
          En cours : {taskCounts?.in_progress || 0}
        </Badge>
        <Badge variant="outline" className="bg-green-50">
          Terminées : {taskCounts?.done || 0}
        </Badge>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => navigate(`/tasks/${projectId}`)}
      >
        <ClipboardList className="h-4 w-4 mr-2" />
        Gérer les tâches
      </Button>
    </div>
  );
};