/**
 * Edge Function : send-email-digest
 * @description Envoie les emails de synthèse quotidienne aux utilisateurs
 * avec leurs notifications en attente (tâches, projets, rôles).
 * Utilise une API HTTP pour l'envoi d'emails (smtp-api).
 * 
 * Configuration :
 * - EDGE_SMTP_API_URL : URL de l'API d'envoi (ex: http://smtp-api:3000/send)
 * - EDGE_SMTP_API_KEY : Clé API pour l'authentification
 * - EDGE_SMTP_FROM : Adresse expéditeur
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration API d'envoi d'email via variables d'environnement
const SMTP_API_URL = Deno.env.get("EDGE_SMTP_API_URL");
const SMTP_API_KEY = Deno.env.get("EDGE_SMTP_API_KEY");
const SMTP_FROM = Deno.env.get("EDGE_SMTP_FROM");
const APP_URL = Deno.env.get("EDGE_APP_URL") || "https://meteor.app";

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

// Interface pour la réponse de l'API smtp-api
interface SmtpApiResponse {
  status?: string;
  error?: string;
}

/**
 * Envoie un email via l'API HTTP smtp-api
 */
async function sendEmailViaApi(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  console.log(`[send-email-digest] Appel API smtp-api pour ${params.to}...`);
  
  const response = await fetch(SMTP_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SMTP_API_KEY!,
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || '',
    }),
  });

  const result: SmtpApiResponse = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || `Erreur API smtp-api: ${response.status}`);
  }

  console.log(`[send-email-digest] Email envoyé via API à ${params.to}`);
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

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[send-email-digest] Démarrage du traitement des notifications email');

  try {
    // Vérifier la configuration minimale
    if (!SMTP_API_URL || !SMTP_API_KEY || !SMTP_FROM) {
      console.error('[send-email-digest] Configuration API manquante');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration API manquante',
          details: 'Veuillez configurer EDGE_SMTP_API_URL, EDGE_SMTP_API_KEY et EDGE_SMTP_FROM dans les secrets Supabase'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de la configuration utilisée
    console.log('[send-email-digest] Configuration:', {
      apiUrl: SMTP_API_URL,
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
        // Vérifier les préférences de l'utilisateur (incluant last_email_sent_at pour la fréquence)
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('email_notifications_enabled, email_digest_frequency, last_email_sent_at')
          .eq('user_id', userId)
          .single();

        // Si les notifications sont désactivées, marquer comme traité sans envoyer
        if (prefs?.email_notifications_enabled === false) {
          console.log(`[send-email-digest] Notifications désactivées pour ${data.user.email}`);
          processedIds.push(...data.notifications.map(n => n.id));
          continue;
        }

        // Vérifier si la fréquence d'envoi est respectée
        const frequencyHours = prefs?.email_digest_frequency ?? 24; // Défaut: 24h
        const lastSentAt = prefs?.last_email_sent_at ? new Date(prefs.last_email_sent_at) : null;
        const now = new Date();

        if (lastSentAt) {
          const hoursSinceLastEmail = (now.getTime() - lastSentAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastEmail < frequencyHours) {
            console.log(`[send-email-digest] Fréquence non atteinte pour ${data.user.email} (${hoursSinceLastEmail.toFixed(1)}h < ${frequencyHours}h) - reporté`);
            // NE PAS marquer comme traité, reporter au prochain cycle
            continue;
          }
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

        // Envoyer l'email via l'API HTTP
        console.log(`[send-email-digest] Envoi email à ${data.user.email}...`);
        
        await sendEmailViaApi({
          from: SMTP_FROM!,
          to: data.user.email,
          subject: subject,
          html: htmlBody,
          text: textBody,
        });

        emailsSent++;
        processedIds.push(...data.notifications.map(n => n.id));
        
        // Mettre à jour last_email_sent_at pour respecter la fréquence
        await supabase
          .from('user_preferences')
          .update({ last_email_sent_at: new Date().toISOString() })
          .eq('user_id', userId);
        
        console.log(`[send-email-digest] Email envoyé à ${data.user.email}, last_email_sent_at mis à jour`);

      } catch (userError: unknown) {
        console.error(`[send-email-digest] Erreur pour ${data.user.email}:`, userError);
        errors.push(`${data.user.email}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
      }
    }

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
