export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  due_date?: string;
  assignee?: string;
}

export interface Column {
  id: "todo" | "in_progress" | "done";
  title: string;
}