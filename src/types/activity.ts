
export interface ActivityType {
  id: string;
  code: string;
  label: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ActivityTypeEnum = "meeting" | "development" | "testing" | "documentation" | "support" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  activityType?: ActivityTypeEnum | string;
  projectId?: string;
  selected?: boolean;
}
