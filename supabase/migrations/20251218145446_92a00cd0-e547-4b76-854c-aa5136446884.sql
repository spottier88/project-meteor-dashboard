-- Mettre à jour le template daily_digest pour inclure les nouvelles inscriptions
UPDATE email_templates 
SET 
  body_html = '<!DOCTYPE html>
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
    .badge-signup { background: #ede9fe; color: #5b21b6; }
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
    
    {{#if has_signups}}
    <div class="section">
      <h2>👤 Nouvelles inscriptions ({{signups_count}})</h2>
      {{signups_list}}
    </div>
    {{/if}}
    
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
      <h2>🔑 Changements de rôles ({{roles_count}})</h2>
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
  body_text = 'Bonjour {{user_first_name}},

Voici le récapitulatif de vos nouvelles notifications du {{date}} :

{{#if has_signups}}
NOUVELLES INSCRIPTIONS ({{signups_count}})
{{signups_list_text}}
{{/if}}

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
  variables = '[
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
    {"name": "roles_list_text", "description": "Liste texte des rôles"},
    {"name": "has_signups", "description": "Booléen: a des nouvelles inscriptions (admin)"},
    {"name": "signups_count", "description": "Nombre de nouvelles inscriptions"},
    {"name": "signups_list", "description": "Liste HTML des inscriptions"},
    {"name": "signups_list_text", "description": "Liste texte des inscriptions"}
  ]'::jsonb,
  updated_at = now()
WHERE code = 'daily_digest';