
import { ProjectStatus, ProgressStatus, ProjectLifecycleStatus } from '@/types/project';

export interface GanttTask {
  id: string;
  start: Date;
  end: Date;
  name: string;
  color: string;
  type: 'project' | 'task' | 'subtask' | 'separator';
  project_id?: string;
  parent_id?: string;
  parent_task_id?: string;
  status?: ProjectStatus;
  progress?: ProgressStatus;
  lifecycle_status?: ProjectLifecycleStatus;
  completion?: number;
  isDisabled?: boolean;
}

export interface GanttLink {
  id: string;
  source: string;
  target: string;
  type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export interface ProjectGanttViewProps {
  projects: Array<{
    id: string;
    title: string;
    start_date?: string;
    end_date?: string;
    status?: ProjectStatus;
    progress?: ProgressStatus;
    lifecycle_status: ProjectLifecycleStatus;
    completion?: number;
    tasks?: Array<{
      id: string;
      title: string;
      start_date?: string;
      due_date?: string;
      status: "todo" | "in_progress" | "done";
      parent_task_id?: string;
    }>;
  }>;
}
