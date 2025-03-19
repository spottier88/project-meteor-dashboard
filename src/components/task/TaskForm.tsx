
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/form/DatePicker";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useTaskForm } from "./useTaskForm";
import { ParentTaskSelector } from "./ParentTaskSelector";
import { AssigneeSelector } from "./AssigneeSelector";
import { TaskFormProps } from "./TaskFormTypes";
import { usePermissionsContext } from "@/contexts/PermissionsContext";

export const TaskForm = ({ 
  isOpen, 
  onClose, 
  onSubmit = () => {}, 
  projectId, 
  task,
  readOnlyFields = false
}: TaskFormProps) => {
  const { isAdmin, isManager } = usePermissionsContext();
  
  // Récupérer les informations du projet pour le chef de projet
  const { data: project, isSuccess: projectLoaded } = useQuery({
    queryKey: ["project-for-task", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("project_manager")
        .eq("id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId && isOpen,
  });

  // Fetch project members
  const { data: projectMembers } = useQuery({
    queryKey: ["projectMembers", projectId, project?.project_manager, isAdmin, isManager],
    queryFn: async () => {
      if (!projectId) return [];
      
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
      
      let membersList = [...data];
      
      // Vérifier si le chef de projet est déjà dans la liste des membres
      if (project?.project_manager) {
        const projectManagerExists = membersList.some(member => 
          member.profiles?.email === project.project_manager
        );
        
        // Si le chef de projet n'est pas dans la liste, le récupérer et l'ajouter
        if (!projectManagerExists) {
          console.log("Adding project manager to members list");
          const { data: pmProfile, error: pmError } = await supabase
            .from("profiles")
            .select("id, email, first_name, last_name")
            .eq("email", project.project_manager)
            .maybeSingle();
            
          if (!pmError && pmProfile) {
            membersList.push({
              user_id: pmProfile.id,
              profiles: pmProfile
            });
          }
        }
      }
      console.log("liste des membres projets :", membersList);
      return membersList;
    },
    enabled: !!projectId && isOpen && projectLoaded,
  });

  // Fetch parent task options - Exclure la tâche actuelle et ses sous-tâches
  const { data: projectTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["project-tasks-for-parent", projectId, task?.id],
    queryFn: async () => {
      if (!projectId) return [];
      
      console.log("Fetching parent tasks for project:", projectId);
      
      // Récupérer d'abord toutes les tâches de premier niveau
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, parent_task_id")
        .eq("project_id", projectId)
        .is("parent_task_id", null);

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }
      
      // Si une tâche est en cours d'édition, récupérer toutes ses sous-tâches pour les exclure aussi
      let subTaskIds: string[] = [];
      if (task?.id) {
        const { data: childTasks, error: childError } = await supabase
          .from("tasks")
          .select("id")
          .eq("parent_task_id", task.id);
          
        if (!childError && childTasks) {
          subTaskIds = childTasks.map(t => t.id);
        }
      }
      
      // Filtrer pour exclure la tâche actuelle et ses sous-tâches
      const filteredTasks = data.filter(t => {
        // Exclure la tâche elle-même
        if (t.id === task?.id) return false;
        // Exclure les sous-tâches de la tâche actuelle
        if (subTaskIds.includes(t.id)) return false;
        return true;
      });
      
      console.log("Fetched eligible parent tasks:", filteredTasks.length);
      return filteredTasks;
    },
    enabled: !!projectId && isOpen,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  // Use the custom hook for form state and logic
  const {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    dueDate,
    setDueDate,
    startDate,
    setStartDate,
    assignee,
    setAssignee,
    assignmentMode,
    setAssignmentMode,
    isSubmitting,
    parentTaskId,
    setParentTaskId,
    handleSubmit,
  } = useTaskForm({
    projectId,
    task,
    onClose,
    onSubmit,
    projectMembers
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1">
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
          
          {!readOnlyFields && (
            <ParentTaskSelector
              parentTaskId={parentTaskId}
              setParentTaskId={setParentTaskId}
              projectTasks={projectTasks}
              tasksLoading={tasksLoading}
            />
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
              <AssigneeSelector
                assignee={assignee}
                setAssignee={setAssignee}
                assignmentMode={assignmentMode}
                setAssignmentMode={setAssignmentMode}
                projectMembers={projectMembers}
              />
              <DatePicker
                label="Date de début"
                date={startDate}
                onDateChange={setStartDate}
              />
              <DatePicker
                label="Date d'échéance"
                date={dueDate}
                onDateChange={setDueDate}
                minDate={startDate}
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
