export interface ReviewAction {
  description: string;
}

export interface TaskStatusUpdate {
  id: string;
  title: string;
  currentStatus: "todo" | "in_progress" | "done";
  newStatus: "todo" | "in_progress" | "done";
}

export interface ReviewForm {
  weather: "sunny" | "cloudy" | "stormy";
  progress: "better" | "stable" | "worse";
  completion: number;
  comment: string;
  actions: ReviewAction[];
  taskStatusUpdates?: TaskStatusUpdate[];
}