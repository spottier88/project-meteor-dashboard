-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "System can insert notifications" ON email_notification_queue;

-- Créer une politique permettant à tout utilisateur authentifié d'insérer
CREATE POLICY "Authenticated users can insert notifications" 
ON email_notification_queue 
FOR INSERT 
TO authenticated
WITH CHECK (true);