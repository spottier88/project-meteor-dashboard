
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ParentTaskSelector } from "./ParentTaskSelector";
import { AssigneeSelector } from "./AssigneeSelector";
import { DateInputField } from "@/components/form/DateInputField";
import { FileText, ExternalLink, ClipboardCheck } from "lucide-react";

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
  documentUrl: string;
  setDocumentUrl: (value: string) => void;
  completionComment: string;
  setCompletionComment: (value: string) => void;
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
  documentUrl,
  setDocumentUrl,
  completionComment,
  setCompletionComment,
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

      {/* Champ lien document OneDrive / SharePoint */}
      <div className="grid gap-2">
        <label htmlFor="documentUrl" className="text-sm font-medium flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Lien document (OneDrive / SharePoint)
        </label>
        {readOnlyFields ? (
          documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
            >
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{documentUrl}</span>
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">Aucun document lié</span>
          )
        ) : (
          <Input
            id="documentUrl"
            type="url"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            placeholder="https://..."
          />
        )}
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

      {/* Champ bilan/résultat conditionnel - visible uniquement si statut "Terminé" */}
      {status === "done" && (
        <div className="grid gap-2">
          <label htmlFor="completionComment" className="text-sm font-medium flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4 text-green-600" />
            Bilan / Résultat
          </label>
          {readOnlyFields ? (
            completionComment ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{completionComment}</p>
            ) : (
              <span className="text-sm text-muted-foreground italic">Aucun bilan renseigné</span>
            )
          ) : (
            <Textarea
              id="completionComment"
              value={completionComment}
              onChange={(e) => setCompletionComment(e.target.value)}
              placeholder="Décrivez le résultat, les livrables ou les conclusions..."
              rows={3}
            />
          )}
        </div>
      )}
      
      {!readOnlyFields && (
        <>
          <AssigneeSelector
            assignee={assignee}
            setAssignee={setAssignee}
            assignmentMode={assignmentMode}
            setAssignmentMode={setAssignmentMode}
            projectMembers={projectMembers}
          />
          <DateInputField
            label="Date de début"
            date={startDate}
            onDateChange={setStartDate}
          />
          <DateInputField
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
