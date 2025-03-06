
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

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  activityType?: string;
  projectId?: string;
  selected?: boolean;
}
