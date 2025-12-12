-- Supprimer l'ancienne contrainte
ALTER TABLE email_notification_queue 
DROP CONSTRAINT IF EXISTS email_notification_queue_event_type_check;

-- Ajouter la nouvelle contrainte avec portfolio_review
ALTER TABLE email_notification_queue 
ADD CONSTRAINT email_notification_queue_event_type_check 
CHECK (event_type = ANY (ARRAY[
  'task_assigned'::text, 
  'project_assigned'::text, 
  'role_changed'::text, 
  'portfolio_review'::text
]));