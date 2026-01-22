-- Supprimer l'ancienne contrainte
ALTER TABLE public.email_notification_queue DROP CONSTRAINT IF EXISTS email_notification_queue_event_type_check;

-- Recréer la contrainte avec la liste exhaustive des types utilisés dans l'application
ALTER TABLE public.email_notification_queue ADD CONSTRAINT email_notification_queue_event_type_check 
CHECK (event_type IN (
  'task_assigned',
  'project_assigned',
  'role_changed',
  'user_signup',
  'admin_feedback',
  'portfolio_review'
));