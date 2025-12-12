-- Ajouter la colonne email_template_id à la table portfolio_review_notifications
ALTER TABLE public.portfolio_review_notifications
ADD COLUMN email_template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL;

-- Créer un modèle de courriel par défaut pour les notifications de revue de portefeuille
INSERT INTO public.email_templates (
  code,
  name,
  subject,
  body_html,
  body_text,
  description,
  variables,
  is_active
) VALUES (
  'portfolio_review_notification',
  'Notification de revue de portefeuille',
  '📋 Revue de projets : {{review_subject}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .info-box { background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
    .label { font-weight: bold; color: #4F46E5; }
    .projects-list { background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
    .projects-list ul { margin: 0; padding-left: 20px; }
    .projects-list li { margin: 5px 0; }
    .message-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .cta-button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 Revue de projets</h1>
    </div>
    <div class="content">
      <p>Bonjour {{manager_name}},</p>
      
      <div class="info-box">
        <p><span class="label">Portefeuille :</span> {{portfolio_name}}</p>
        <p><span class="label">Objet :</span> {{review_subject}}</p>
        <p><span class="label">Date prévue :</span> {{review_date}}</p>
      </div>
      
      <div class="projects-list">
        <p class="label">Vos projets concernés :</p>
        <ul>
          {{project_titles}}
        </ul>
      </div>
      
      {{#if message}}
      <div class="message-box">
        <p class="label">Message de l''organisateur :</p>
        <p>{{message}}</p>
      </div>
      {{/if}}
      
      <p>Merci de mettre à jour l''état d''avancement de vos projets avant la date de la revue.</p>
      
      <center>
        <a href="{{app_url}}" class="cta-button">Accéder à l''application</a>
      </center>
    </div>
    <div class="footer">
      <p>Cet email a été envoyé automatiquement par l''application de gestion de projets.</p>
    </div>
  </div>
</body>
</html>',
  'Bonjour {{manager_name}},

Une revue de projets est organisée pour le portefeuille "{{portfolio_name}}".

Objet : {{review_subject}}
Date prévue : {{review_date}}

Vos projets concernés :
{{project_titles}}

{{#if message}}
Message de l''organisateur :
{{message}}
{{/if}}

Merci de mettre à jour l''état d''avancement de vos projets avant la date de la revue.

Cordialement,
L''équipe de gestion de projets',
  'Modèle utilisé pour notifier les chefs de projet d''une revue de portefeuille à venir. Variables disponibles : manager_name, portfolio_name, review_subject, review_date, project_titles, message, app_url',
  '[
    {"name": "manager_name", "description": "Nom du chef de projet destinataire"},
    {"name": "portfolio_name", "description": "Nom du portefeuille de projets"},
    {"name": "review_subject", "description": "Objet de la revue"},
    {"name": "review_date", "description": "Date prévue de la revue"},
    {"name": "project_titles", "description": "Liste des titres de projets concernés"},
    {"name": "message", "description": "Message personnalisé optionnel"},
    {"name": "app_url", "description": "URL de l''application"}
  ]'::jsonb,
  true
);