-- Migration : Ajouter le type d'événement 'project_note_added' pour les notifications de notes de projet
-- Supprimer l'ancienne contrainte
ALTER TABLE public.email_notification_queue 
DROP CONSTRAINT IF EXISTS email_notification_queue_event_type_check;

-- Recréer la contrainte avec le nouveau type 'project_note_added'
ALTER TABLE public.email_notification_queue 
ADD CONSTRAINT email_notification_queue_event_type_check 
CHECK (event_type IN (
  'task_assigned',
  'project_assigned',
  'role_changed',
  'user_signup',
  'admin_feedback',
  'portfolio_review',
  'project_note_added'
));