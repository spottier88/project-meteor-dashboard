
export interface TaskFormProps {
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
    document_url?: string;
    completion_comment?: string;
  };
  readOnlyFields?: boolean;
}
