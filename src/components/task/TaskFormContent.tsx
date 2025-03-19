
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/form/DatePicker";
import { Separator } from "@/components/ui/separator";
import { ParentTaskSelector } from "./ParentTaskSelector";
import { AssigneeSelector } from "./AssigneeSelector";

interface TaskFormContentProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  status: "todo" | "in_progress" | "done";
  setStatus: (value: "todo" | "in_progress" | "done") => void;
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  assignee: string;
  setAssignee: (value: string) => void;
  assignmentMode: "free" | "member";
  setAssignmentMode: (value: "free" | "member") => void;
  parentTaskId: string | undefined;
  setParentTaskId: (value: string | undefined) => void;
  projectTasks: Array<{ id: string; title: string }> | undefined;
  tasksLoading: boolean;
  projectMembers: Array<{
    user_id: string;
    profiles: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    }
  }> | null | undefined;
  readOnlyFields: boolean;
}

export const TaskFormContent = ({
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
  parentTaskId,
  setParentTaskId,
  projectTasks,
  tasksLoading,
  projectMembers,
  readOnlyFields
}: TaskFormContentProps) => {
  return (
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
  );
};
