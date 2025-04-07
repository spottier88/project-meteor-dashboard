
/**
 * Types pour le composant wx-react-gantt
 * Basé sur la documentation: https://docs.svar.dev/react/gantt/getting_started/
 */

// Types de base du composant Gantt
export interface GanttTask {
  id: string | number;
  parentId?: string | number | null;
  name: string;
  start: Date | null;
  end: Date | null;
  progress?: number;
  type: string; // Champ obligatoire pour wx-react-gantt: 'task', 'project', 'milestone'
  hideChildren?: boolean;
  isExpanded?: boolean;
  backgroundColor?: string;
  // Champs supplémentaires pour la gestion des tâches
  project_id?: string;
  status?: "todo" | "in_progress" | "done";
  assignee?: string;
}

export interface GanttDependency {
  id: string | number;
  fromId: string | number;
  toId: string | number;
  type: number; // 0: Finish-to-Start, 1: Start-to-Start, 2: Finish-to-Finish, 3: Start-to-Finish
}

export interface GanttColumn {
  name: string;
  key: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'center' | 'left' | 'right';
  sortable?: boolean;
  resizable?: boolean;
  cellRenderer?: (task: GanttTask) => React.ReactNode;
  headerRenderer?: (column: GanttColumn) => React.ReactNode;
}

// Interface pour le composant GanttBoard
export interface GanttBoardProps {
  projectId: string;
  tasks?: Array<{
    id: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    assignee?: string;
    due_date?: string;
    start_date?: string;
    project_id: string;
    parent_task_id?: string | null;
  }>;
  readOnly?: boolean;
  onEditTask?: (task: any) => void;
}
