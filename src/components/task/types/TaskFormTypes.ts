
// Types pour le formulaire de tâche
export interface TaskData {
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  due_date?: string;
  start_date?: string;
  assignee?: string;
  parent_task_id?: string | null;
  document_url?: string | null;
  id?: string;
}

export interface UseTaskFormParams {
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
    document_url?: string;
  };
  onClose: () => void;
  onSubmit?: () => void;
  projectMembers?: Array<{
    user_id: string;
    profiles: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    }
  }> | null;
}

export interface TaskFormState {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  dueDate: Date | undefined;
  startDate: Date | undefined;
  assignee: string;
  assignmentMode: "free" | "member";
  parentTaskId: string | undefined;
  documentUrl: string;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
}
