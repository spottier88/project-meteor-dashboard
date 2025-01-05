import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Task } from "./types";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canManageProjectItems } from "@/utils/permissions";

interface KanbanTaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  projectOwnerId?: string;
  projectManagerEmail?: string;
}

export const KanbanTaskCard = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  projectOwnerId,
  projectManagerEmail,
}: KanbanTaskCardProps) => {
  const user = useUser();

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles", user?.id],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id);
      return roles?.map((r) => r.role) || [];
    },
    enabled: !!user?.id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user?.id)
        .single();
      return profile;
    },
    enabled: !!user?.id,
  });

  const canManage = canManageProjectItems(
    userRoles,
    user?.id,
    projectOwnerId,
    projectManagerEmail,
    userProfile?.email
  );

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-2">
        <div className="font-medium">{task.title}</div>
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {task.assignee || "Non assigné"}
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(task)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Select
              value={task.status}
              onValueChange={(value) =>
                onStatusChange(task.id, value as Task["status"])
              }
              disabled={!canManage}
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
        </div>
      </CardContent>
    </Card>
  );
};