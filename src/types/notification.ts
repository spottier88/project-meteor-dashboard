export type NotificationType = 'system' | 'user';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  publication_date: string;
  created_at: string;
  created_by?: string;
  published: boolean | null;
}

export interface UserNotification {
  id: string;
  notification_id: string;
  user_id: string;
  read_at: string | null;
  created_at: string;
}