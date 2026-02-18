
import { useState, useEffect } from "react";
import { UseTaskFormParams } from "../types/TaskFormTypes";

export const useTaskFormInitialization = ({ task, projectMembers }: Pick<UseTaskFormParams, "task" | "projectMembers">) => {
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
  const [parentTaskId, setParentTaskId] = useState<string | undefined>(task?.parent_task_id);
  const [documentUrl, setDocumentUrl] = useState(task?.document_url || "");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setStartDate(task.start_date ? new Date(task.start_date) : undefined);
      setAssignee(task.assignee || "");
      setParentTaskId(task.parent_task_id);
      setDocumentUrl(task.document_url || "");
      
      const isMember = projectMembers?.some(m => m.profiles.email === task.assignee);
      setAssignmentMode(isMember ? "member" : "free");
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setDueDate(undefined);
      setStartDate(undefined);
      setAssignee("");
      setParentTaskId(undefined);
      setDocumentUrl("");
      
      if (projectMembers && projectMembers.length > 0) {
        setAssignmentMode("member");
      } else {
        setAssignmentMode("free");
      }
    }
  }, [task, projectMembers]);

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setDueDate(undefined);
    setStartDate(undefined);
    setAssignee("");
    setParentTaskId(undefined);
    setDocumentUrl("");
    
    if (projectMembers && projectMembers.length > 0) {
      setAssignmentMode("member");
    } else {
      setAssignmentMode("free");
    }
  };

  return {
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
    documentUrl,
    setDocumentUrl,
    resetForm
  };
};
