-- Supprimer l'ancienne contrainte
ALTER TABLE email_notification_queue DROP CONSTRAINT IF EXISTS email_notification_queue_event_type_check;

-- Recréer la contrainte avec tous les types nécessaires
ALTER TABLE email_notification_queue ADD CONSTRAINT email_notification_queue_event_type_check 
CHECK (event_type IN ('user_signup', 'admin_feedback', 'project_assigned'));