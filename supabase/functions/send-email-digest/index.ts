/**
 * Edge Function : send-email-digest
 * @description Envoie les emails de synthèse quotidienne aux utilisateurs
 * avec leurs notifications en attente (tâches, projets, rôles).
 * Utilise un serveur SMTP configuré via les secrets Supabase.
 * 
 * Configuration SMTP flexible :
 * - Mode authentifié : EDGE_SMTP_USER et EDGE_SMTP_PASS requis
 * - Mode non authentifié (self-hosted) : seulement EDGE_SMTP_HOST et EDGE_SMTP_FROM requis
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration SMTP via variables d'environnement
const SMTP_HOST = Deno.env.get("EDGE_SMTP_HOST");
const SMTP_PORT = parseInt(Deno.env.get("EDGE_SMTP_PORT") || "25");
const SMTP_USER = Deno.env.get("EDGE_SMTP_USER");
const SMTP_PASS = Deno.env.get("EDGE_SMTP_PASS");
const SMTP_FROM = Deno.env.get("EDGE_SMTP_FROM");
const SMTP_TLS = Deno.env.get("EDGE_SMTP_TLS");
const APP_URL = Deno.env.get("EDGE_APP_URL") || "https://meteor.app";

// Déterminer si l'authentification est requise (credentials présents)
const SMTP_AUTH_ENABLED = !!(SMTP_USER && SMTP_PASS);

// Déterminer le mode TLS : explicite via variable, ou automatique si port 465
const SMTP_USE_TLS = SMTP_TLS === "true" || (SMTP_TLS !== "false" && SMTP_PORT === 465);

// Interface pour les notifications groupées par utilisateur
interface UserNotificationGroup {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  notifications: Array<{
    id: string;
    event_type: string;
    event_data: Record<string, unknown>;
    created_at: string;
  }>;
}

/**
 * Remplace les variables de publipostage dans un template
 */
function mergeTemplate(template: string, variables: Record<string, string | boolean | number>): string {
  let result = template;
  
  // Remplacer les variables simples {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  // Gérer les conditions {{#if variable}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (_, varName, content) => {
    const value = variables[varName];
    return value ? content : '';
  });
  
  return result;
}

/**
 * Génère la liste HTML des tâches
 */
function generateTasksListHtml(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      const dueDate = data.due_date ? new Date(data.due_date as string).toLocaleDateString('fr-FR') : 'Non définie';
      return `<div class="item">
        <div class="item-title">${data.task_title || 'Tâche sans titre'}</div>
        <div class="item-meta">
          <span class="badge badge-task">Projet : ${data.project_title || 'N/A'}</span>
          <span style="margin-left: 10px;">Échéance : ${dueDate}</span>
        </div>
      </div>`;
    })
    .join('');
}

/**
 * Génère la liste texte des tâches
 */
function generateTasksListText(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      const dueDate = data.due_date ? new Date(data.due_date as string).toLocaleDateString('fr-FR') : 'Non définie';
      return `- ${data.task_title || 'Tâche sans titre'} (Projet: ${data.project_title || 'N/A'}, Échéance: ${dueDate})`;
    })
    .join('\n');
}

/**
 * Génère la liste HTML des projets
 */
function generateProjectsListHtml(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      const roleLabel = data.role === 'secondary_manager' ? 'Chef de projet secondaire' : 
                       data.role === 'member' ? 'Membre' : String(data.role || 'Membre');
      return `<div class="item">
        <div class="item-title">${data.project_title || 'Projet sans titre'}</div>
        <div class="item-meta">
          <span class="badge badge-project">Rôle : ${roleLabel}</span>
        </div>
      </div>`;
    })
    .join('');
}

/**
 * Génère la liste texte des projets
 */
function generateProjectsListText(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      return `- ${data.project_title || 'Projet sans titre'} (Rôle: ${data.role || 'Membre'})`;
    })
    .join('\n');
}

/**
 * Génère la liste HTML des changements de rôles
 */
function generateRolesListHtml(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      const action = data.action === 'added' ? 'Ajouté' : 'Retiré';
      const badgeClass = data.action === 'added' ? 'badge-project' : 'badge-task';
      return `<div class="item">
        <div class="item-title">${data.role_label || data.role}</div>
        <div class="item-meta">
          <span class="badge ${badgeClass}">${action}</span>
        </div>
      </div>`;
    })
    .join('');
}

/**
 * Génère la liste texte des changements de rôles
 */
function generateRolesListText(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      const action = data.action === 'added' ? 'Ajouté' : 'Retiré';
      return `- ${data.role_label || data.role} (${action})`;
    })
    .join('\n');
}

/**
 * Crée la configuration SMTP selon le mode (authentifié ou non)
 */
function createSmtpConfig() {
  const baseConfig = {
    hostname: SMTP_HOST!,
    port: SMTP_PORT,
    tls: SMTP_USE_TLS,
  };

  // Ajouter l'authentification seulement si les credentials sont présents
  if (SMTP_AUTH_ENABLED) {
    return {
      connection: {
        ...baseConfig,
        auth: {
          username: SMTP_USER!,
          password: SMTP_PASS!,
        },
      },
    };
  }

  // Mode sans authentification (relais interne)
  return {
    connection: baseConfig,
  };
}

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[send-email-digest] Démarrage du traitement des notifications email');

  try {
    // Vérifier la configuration SMTP minimale
    if (!SMTP_HOST || !SMTP_FROM) {
      console.error('[send-email-digest] Configuration SMTP minimale manquante (SMTP_HOST ou SMTP_FROM)');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration SMTP manquante',
          details: 'Veuillez configurer EDGE_SMTP_HOST et EDGE_SMTP_FROM dans les secrets Supabase'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de la configuration SMTP utilisée
    console.log('[send-email-digest] Configuration SMTP:', {
      host: SMTP_HOST,
      port: SMTP_PORT,
      tls: SMTP_USE_TLS,
      auth: SMTP_AUTH_ENABLED ? 'authentifié' : 'sans authentification',
      from: SMTP_FROM,
    });

    // Créer le client Supabase avec la clé service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Récupérer le modèle d'email actif pour la synthèse quotidienne
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('code', 'daily_digest')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('[send-email-digest] Modèle email non trouvé:', templateError);
      return new Response(
        JSON.stringify({ error: 'Modèle email daily_digest non trouvé ou inactif' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-email-digest] Modèle email chargé:', template.name);

    // Récupérer les notifications en attente avec les infos utilisateur
    const { data: pendingNotifications, error: notifError } = await supabase
      .from('email_notification_queue')
      .select('*')
      .is('processed_at', null)
      .order('created_at', { ascending: true });

    if (notifError) {
      console.error('[send-email-digest] Erreur récupération notifications:', notifError);
      throw notifError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('[send-email-digest] Aucune notification en attente');
      return new Response(
        JSON.stringify({ success: true, message: 'Aucune notification en attente', emailsSent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-email-digest] ${pendingNotifications.length} notifications en attente`);

    // Grouper les notifications par utilisateur
    const userNotificationsMap = new Map<string, UserNotificationGroup>();
    
    for (const notif of pendingNotifications) {
      const userId = notif.user_id;
      
      if (!userNotificationsMap.has(userId)) {
        // Récupérer les infos de l'utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('id', userId)
          .single();
        
        if (profile) {
          userNotificationsMap.set(userId, {
            user: profile,
            notifications: []
          });
        }
      }
      
      const group = userNotificationsMap.get(userId);
      if (group) {
        group.notifications.push({
          id: notif.id,
          event_type: notif.event_type,
          event_data: notif.event_data,
          created_at: notif.created_at
        });
      }
    }

    console.log(`[send-email-digest] ${userNotificationsMap.size} utilisateurs à notifier`);

    // Initialiser le client SMTP avec la configuration flexible
    const smtpConfig = createSmtpConfig();
    console.log('[send-email-digest] Connexion SMTP en cours...');
    const client = new SMTPClient(smtpConfig);

    let emailsSent = 0;
    const processedIds: string[] = [];
    const errors: string[] = [];
    const today = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Traiter chaque utilisateur
    for (const [userId, data] of userNotificationsMap) {
      try {
        // Vérifier les préférences de l'utilisateur
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('email_notifications_enabled, email_digest_frequency')
          .eq('user_id', userId)
          .single();

        // Si les notifications sont désactivées, marquer comme traité sans envoyer
        if (prefs?.email_notifications_enabled === false) {
          console.log(`[send-email-digest] Notifications désactivées pour ${data.user.email}`);
          processedIds.push(...data.notifications.map(n => n.id));
          continue;
        }

        // Séparer les notifications par type
        const taskNotifs = data.notifications.filter(n => n.event_type === 'task_assigned');
        const projectNotifs = data.notifications.filter(n => n.event_type === 'project_assigned');
        const roleNotifs = data.notifications.filter(n => n.event_type === 'role_changed');

        // Préparer les variables de publipostage
        const variables: Record<string, string | boolean | number> = {
          user_first_name: data.user.first_name || 'Utilisateur',
          user_last_name: data.user.last_name || '',
          user_email: data.user.email || '',
          date: today,
          app_url: APP_URL,
          has_tasks: taskNotifs.length > 0,
          tasks_count: taskNotifs.length,
          tasks_list: generateTasksListHtml(taskNotifs),
          tasks_list_text: generateTasksListText(taskNotifs),
          has_projects: projectNotifs.length > 0,
          projects_count: projectNotifs.length,
          projects_list: generateProjectsListHtml(projectNotifs),
          projects_list_text: generateProjectsListText(projectNotifs),
          has_roles: roleNotifs.length > 0,
          roles_count: roleNotifs.length,
          roles_list: generateRolesListHtml(roleNotifs),
          roles_list_text: generateRolesListText(roleNotifs),
        };

        // Fusionner le template avec les variables
        const htmlBody = mergeTemplate(template.body_html, variables);
        const textBody = template.body_text ? mergeTemplate(template.body_text, variables) : undefined;
        const subject = mergeTemplate(template.subject, variables);

        // Envoyer l'email
        console.log(`[send-email-digest] Envoi email à ${data.user.email}...`);
        
        await client.send({
          from: SMTP_FROM!,
          to: data.user.email,
          subject: subject,
          html: htmlBody,
          content: textBody,
        });

        emailsSent++;
        processedIds.push(...data.notifications.map(n => n.id));
        console.log(`[send-email-digest] Email envoyé à ${data.user.email}`);

      } catch (userError: unknown) {
        console.error(`[send-email-digest] Erreur pour ${data.user.email}:`, userError);
        errors.push(`${data.user.email}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
      }
    }

    // Fermer la connexion SMTP
    await client.close();

    // Marquer les notifications comme traitées
    if (processedIds.length > 0) {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('email_notification_queue')
        .update({ 
          processed_at: now,
          email_sent_at: now
        })
        .in('id', processedIds);

      if (updateError) {
        console.error('[send-email-digest] Erreur mise à jour notifications:', updateError);
      }
    }

    console.log(`[send-email-digest] Terminé: ${emailsSent} emails envoyés, ${processedIds.length} notifications traitées`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        notificationsProcessed: processedIds.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[send-email-digest] Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
