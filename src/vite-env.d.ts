
/// <reference types="vite/client" />

declare module 'wx-react-gantt' {
  export interface Task {
    id: string;
    name: string;
    start: Date;
    end: Date;
    progress: number;
    type: 'task' | 'milestone' | 'project';
    hideChildren?: boolean;
    styles?: {
      backgroundColor?: string;
      backgroundSelectedColor?: string;
      progressColor?: string;
      progressSelectedColor?: string;
    };
    isDisabled?: boolean;
    project?: string;
    dependencies?: string[];
    canHaveChildren?: boolean;
  }

  export enum ViewMode {
    Hour = "Hour",
    QuarterDay = "Quarter Day",
    HalfDay = "Half Day",
    Day = "Day",
    Week = "Week",
    Month = "Month",
    Year = "Year"
  }

  export interface GanttProps {
    tasks: Task[];
    viewMode?: ViewMode;
    onClick?: (task: Task) => void;
    onDoubleClick?: (task: Task) => void;
    onDateChange?: (task: Task) => void;
    onProgressChange?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    onSelect?: (task: Task) => void;
    listCellWidth?: string;
    ganttHeight?: number;
    rowHeight?: number;
    barCornerRadius?: number;
    handleWidth?: number;
    fontFamily?: string;
    TooltipContent?: React.FC<{ task: Task }>;
    locale?: string;
    barFill?: number;
    barProgressColor?: string;
    barProgressSelectedColor?: string;
    projectProgressColor?: string;
    projectProgressSelectedColor?: string;
    arrowColor?: string;
    todayColor?: string;
    rtl?: boolean;
    columnWidth?: number;
  }

  export const Gantt: React.FC<GanttProps>;
}
