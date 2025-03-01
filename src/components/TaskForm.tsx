
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerField } from "./form/DatePickerField";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  projectId: string;
  task?: {
    id: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    due_date?: string;
    start_date?: string;
    assignee?: string;
    parent_task_id?: string;
  };
  readOnlyFields?: boolean;
}

export const TaskForm = ({ 
  isOpen, 
  onClose, 
  onSubmit = () => {}, 
  projectId, 
  task,
  readOnlyFields = false
}: TaskFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">(task?.status || "todo");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    task?.start_date ? new Date(task.start_date) : undefined
  );
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [assignmentMode, setAssignmentMode] = useState<"free" | "member">("free");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | undefined>(task?.parent_task_id);

  const { data: projectMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId && isOpen,
  });

  const { data: projectTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks-for-parent", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, parent_task_id")
        .eq("project_id", projectId)
        .is("parent_task_id", null);

      if (error) throw error;
      
      return task ? data.filter(t => t.id !== task.id) : data;
    },
    enabled: !!projectId && isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setStatus(task.status);
        setDueDate(task.due_date ? new Date(task.due_date) : undefined);
        setStartDate(task.start_date ? new Date(task.start_date) : undefined);
        setAssignee(task.assignee || "");
        setParentTaskId(task.parent_task_id);
        setAssignmentMode(
          projectMembers?.some(m => m.profiles.email === task.assignee)
            ? "member"
            : "free"
        );
      } else {
        resetForm();
      }
    }
  }, [task, isOpen, projectMembers]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setDueDate(undefined);
    setStartDate(undefined);
    setAssignee("");
    setAssignmentMode("free");
    setParentTaskId(undefined);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est requis",
        variant: "destructive",
      });
      return;
    }

    if (startDate && dueDate && startDate > dueDate) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date d'échéance",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title,
        description,
        status,
        due_date: dueDate?.toISOString().split('T')[0],
        start_date: startDate?.toISOString().split('T')[0],
        assignee,
        project_id: projectId,
        parent_task_id: parentTaskId === "none" ? null : parentTaskId || null,
      };

      if (task?.id) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La tâche a été mise à jour",
        });
      } else {
        const { error } = await supabase.from("tasks").insert(taskData);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "La tâche a été créée",
        });
        resetForm();
      }

      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      
      onSubmit();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Titre *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              readOnly={readOnlyFields}
              className={readOnlyFields ? "bg-gray-100" : ""}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche"
            />
          </div>
          
          {!readOnlyFields && projectTasks && projectTasks.length > 0 && (
            <div className="grid gap-2">
              <label htmlFor="parent-task" className="text-sm font-medium">
                Tâche parente (optionnel)
              </label>
              <Select 
                value={parentTaskId || "none"} 
                onValueChange={value => setParentTaskId(value === "none" ? undefined : value)}
                disabled={tasksLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une tâche parente (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune (tâche de premier niveau)</SelectItem>
                  {projectTasks?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Une tâche parent aura sa date d'échéance automatiquement ajustée en fonction des sous-tâches.
              </p>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Statut
            </label>
            <Select value={status} onValueChange={(value: "todo" | "in_progress" | "done") => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">À faire</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="done">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {!readOnlyFields && (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Responsable
                </label>
                <Tabs value={assignmentMode} onValueChange={(value: "free" | "member") => setAssignmentMode(value)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="free">Saisie libre</TabsTrigger>
                    <TabsTrigger value="member">Membre du projet</TabsTrigger>
                  </TabsList>
                  <TabsContent value="free">
                    <Input
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      placeholder="Nom du responsable"
                    />
                  </TabsContent>
                  <TabsContent value="member">
                    <Select
                      value={assignee}
                      onValueChange={setAssignee}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un membre" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectMembers?.map((member) => (
                          <SelectItem key={member.user_id} value={member.profiles.email}>
                            {member.profiles.first_name} {member.profiles.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>
              </div>
              <DatePickerField
                label="Date de début"
                value={startDate}
                onChange={setStartDate}
              />
              <DatePickerField
                label="Date d'échéance"
                value={dueDate}
                onChange={setDueDate}
              />
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Enregistrement..."
            ) : task ? (
              "Mettre à jour"
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
