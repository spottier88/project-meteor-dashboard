-- ============================================
-- SYSTÈME DE NOTIFICATION EMAIL AVEC MODÈLES
-- ============================================

-- 1. Table des modèles d'email
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche par code
CREATE INDEX idx_email_templates_code ON email_templates(code);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

-- Trigger pour updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS pour email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All authenticated users can view active templates" ON email_templates
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- 2. Table de file d'attente des notifications email
CREATE TABLE public.email_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('task_assigned', 'project_assigned', 'role_changed')),
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ DEFAULT NULL,
  email_sent_at TIMESTAMPTZ DEFAULT NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_notification_queue_pending 
ON email_notification_queue(user_id, created_at) 
WHERE processed_at IS NULL;

CREATE INDEX idx_notification_queue_user 
ON email_notification_queue(user_id);

-- RLS pour email_notification_queue
ALTER TABLE email_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON email_notification_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON email_notification_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Politique pour permettre les insertions via triggers (SECURITY DEFINER)
CREATE POLICY "System can insert notifications" ON email_notification_queue
  FOR INSERT WITH CHECK (true);

-- 3. Extension des préférences utilisateur
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_digest_frequency INTEGER DEFAULT 24;

-- 4. Trigger pour affectation de tâche
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  project_title TEXT;
BEGIN
  -- Vérifier si l'assignee a changé et n'est pas null
  IF NEW.assignee IS NOT NULL AND (OLD IS NULL OR OLD.assignee IS DISTINCT FROM NEW.assignee) THEN
    -- Trouver l'utilisateur par email dans profiles
    SELECT id INTO target_user_id FROM profiles WHERE email = NEW.assignee;
    
    IF target_user_id IS NOT NULL THEN
      -- Récupérer le titre du projet
      SELECT title INTO project_title FROM projects WHERE id = NEW.project_id;
      
      -- Insérer dans la file d'attente
      INSERT INTO email_notification_queue (user_id, event_type, event_data)
      VALUES (
        target_user_id,
        'task_assigned',
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'project_id', NEW.project_id,
          'project_title', COALESCE(project_title, 'Projet inconnu'),
          'due_date', NEW.due_date,
          'description', NEW.description
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur tasks
CREATE TRIGGER on_task_assignment
AFTER INSERT OR UPDATE OF assignee ON tasks
FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();

-- 5. Trigger pour affectation à un projet
CREATE OR REPLACE FUNCTION notify_project_assignment()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  project_desc TEXT;
BEGIN
  -- Récupérer les infos du projet
  SELECT title, description INTO project_title, project_desc 
  FROM projects WHERE id = NEW.project_id;
  
  -- Insérer dans la file d'attente
  INSERT INTO email_notification_queue (user_id, event_type, event_data)
  VALUES (
    NEW.user_id,
    'project_assigned',
    jsonb_build_object(
      'project_id', NEW.project_id,
      'project_title', COALESCE(project_title, 'Projet inconnu'),
      'project_description', project_desc,
      'role', COALESCE(NEW.role, 'membre')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur project_members
CREATE TRIGGER on_project_member_added
AFTER INSERT ON project_members
FOR EACH ROW EXECUTE FUNCTION notify_project_assignment();

-- 6. Trigger pour modification de rôle
CREATE OR REPLACE FUNCTION notify_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO email_notification_queue (user_id, event_type, event_data)
    VALUES (
      NEW.user_id, 
      'role_changed', 
      jsonb_build_object(
        'action', 'added', 
        'role', NEW.role,
        'role_label', CASE NEW.role
          WHEN 'admin' THEN 'Administrateur'
          WHEN 'chef_projet' THEN 'Chef de projet'
          WHEN 'manager' THEN 'Manager'
          WHEN 'membre' THEN 'Membre'
          WHEN 'time_tracker' THEN 'Suivi d''activités'
          WHEN 'portfolio_manager' THEN 'Gestionnaire de portefeuille'
          ELSE NEW.role::TEXT
        END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO email_notification_queue (user_id, event_type, event_data)
    VALUES (
      OLD.user_id, 
      'role_changed', 
      jsonb_build_object(
        'action', 'removed', 
        'role', OLD.role,
        'role_label', CASE OLD.role
          WHEN 'admin' THEN 'Administrateur'
          WHEN 'chef_projet' THEN 'Chef de projet'
          WHEN 'manager' THEN 'Manager'
          WHEN 'membre' THEN 'Membre'
          WHEN 'time_tracker' THEN 'Suivi d''activités'
          WHEN 'portfolio_manager' THEN 'Gestionnaire de portefeuille'
          ELSE OLD.role::TEXT
        END
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur user_roles
CREATE TRIGGER on_role_change
AFTER INSERT OR DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION notify_role_change();

-- 7. Insérer le modèle d'email par défaut pour la synthèse quotidienne
INSERT INTO email_templates (code, name, subject, body_html, body_text, variables, description, is_active)
VALUES (
  'daily_digest',
  'Synthèse quotidienne des notifications',
  '[Meteor] Synthèse de vos notifications du {{date}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
    .section h2 { margin-top: 0; color: #667eea; font-size: 18px; }
    .item { padding: 12px; background: #f3f4f6; margin: 10px 0; border-radius: 6px; }
    .item-title { font-weight: bold; color: #1f2937; }
    .item-meta { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge-task { background: #dbeafe; color: #1e40af; }
    .badge-project { background: #d1fae5; color: #065f46; }
    .badge-role { background: #fef3c7; color: #92400e; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .empty { text-align: center; color: #9ca3af; padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌟 Meteor - Synthèse du {{date}}</h1>
  </div>
  <div class="content">
    <p>Bonjour <strong>{{user_first_name}}</strong>,</p>
    <p>Voici le récapitulatif de vos nouvelles notifications :</p>
    
    {{#if has_tasks}}
    <div class="section">
      <h2>📋 Nouvelles tâches assignées ({{tasks_count}})</h2>
      {{tasks_list}}
    </div>
    {{/if}}
    
    {{#if has_projects}}
    <div class="section">
      <h2>📁 Nouveaux projets ({{projects_count}})</h2>
      {{projects_list}}
    </div>
    {{/if}}
    
    {{#if has_roles}}
    <div class="section">
      <h2>👤 Changements de rôles ({{roles_count}})</h2>
      {{roles_list}}
    </div>
    {{/if}}
    
    <center>
      <a href="{{app_url}}" class="btn">Accéder à Meteor</a>
    </center>
  </div>
  <div class="footer">
    <p>Cet email a été envoyé automatiquement par Meteor.</p>
    <p>Pour modifier vos préférences de notification, rendez-vous dans votre profil.</p>
  </div>
</body>
</html>',
  'Bonjour {{user_first_name}},

Voici le récapitulatif de vos nouvelles notifications du {{date}} :

{{#if has_tasks}}
NOUVELLES TÂCHES ASSIGNÉES ({{tasks_count}})
{{tasks_list_text}}
{{/if}}

{{#if has_projects}}
NOUVEAUX PROJETS ({{projects_count}})
{{projects_list_text}}
{{/if}}

{{#if has_roles}}
CHANGEMENTS DE RÔLES ({{roles_count}})
{{roles_list_text}}
{{/if}}

Accédez à Meteor : {{app_url}}

---
Cet email a été envoyé automatiquement par Meteor.
Pour modifier vos préférences de notification, rendez-vous dans votre profil.',
  '[
    {"name": "user_first_name", "description": "Prénom de l''utilisateur"},
    {"name": "user_last_name", "description": "Nom de l''utilisateur"},
    {"name": "user_email", "description": "Email de l''utilisateur"},
    {"name": "date", "description": "Date de la synthèse"},
    {"name": "app_url", "description": "URL de l''application"},
    {"name": "has_tasks", "description": "Booléen: a des tâches"},
    {"name": "tasks_count", "description": "Nombre de tâches"},
    {"name": "tasks_list", "description": "Liste HTML des tâches"},
    {"name": "tasks_list_text", "description": "Liste texte des tâches"},
    {"name": "has_projects", "description": "Booléen: a des projets"},
    {"name": "projects_count", "description": "Nombre de projets"},
    {"name": "projects_list", "description": "Liste HTML des projets"},
    {"name": "projects_list_text", "description": "Liste texte des projets"},
    {"name": "has_roles", "description": "Booléen: a des changements de rôles"},
    {"name": "roles_count", "description": "Nombre de changements de rôles"},
    {"name": "roles_list", "description": "Liste HTML des rôles"},
    {"name": "roles_list_text", "description": "Liste texte des rôles"}
  ]'::JSONB,
  'Modèle pour l''email de synthèse quotidienne envoyé aux utilisateurs avec leurs nouvelles notifications (tâches, projets, rôles).',
  true
);