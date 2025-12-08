/**
 * Edge Function : send-test-email
 * @description Envoie un email de test à l'utilisateur connecté
 * avec des données fictives pour prévisualiser le rendu réel du template.
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
  console.log(`[send-test-email] Appel API smtp-api pour ${params.to}...`);
  
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

  console.log(`[send-test-email] Email envoyé via API à ${params.to}`);
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
 * Génère des données de test pour prévisualiser le template
 */
function generateTestData(userEmail: string, userFirstName: string, userLastName: string): Record<string, string | boolean | number> {
  const today = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return {
    // Variables utilisateur
    user_first_name: userFirstName || 'Prénom',
    user_last_name: userLastName || 'Nom',
    user_email: userEmail,
    date: today,
    app_url: APP_URL,
    
    // Variables tâches de test
    has_tasks: true,
    tasks_count: 2,
    tasks_list: `
      <div class="item">
        <div class="item-title">[TEST] Exemple de tâche 1</div>
        <div class="item-meta">
          <span class="badge badge-task">Projet : Projet de démonstration</span>
          <span style="margin-left: 10px;">Échéance : 31/12/2025</span>
        </div>
      </div>
      <div class="item">
        <div class="item-title">[TEST] Exemple de tâche 2</div>
        <div class="item-meta">
          <span class="badge badge-task">Projet : Autre projet test</span>
          <span style="margin-left: 10px;">Échéance : 15/01/2026</span>
        </div>
      </div>
    `,
    tasks_list_text: `- [TEST] Exemple de tâche 1 (Projet: Projet de démonstration, Échéance: 31/12/2025)\n- [TEST] Exemple de tâche 2 (Projet: Autre projet test, Échéance: 15/01/2026)`,
    
    // Variables projets de test
    has_projects: true,
    projects_count: 1,
    projects_list: `
      <div class="item">
        <div class="item-title">[TEST] Nouveau projet assigné</div>
        <div class="item-meta">
          <span class="badge badge-project">Rôle : Membre</span>
        </div>
      </div>
    `,
    projects_list_text: `- [TEST] Nouveau projet assigné (Rôle: Membre)`,
    
    // Variables rôles de test
    has_roles: true,
    roles_count: 1,
    roles_list: `
      <div class="item">
        <div class="item-title">[TEST] Chef de projet</div>
        <div class="item-meta">
          <span class="badge badge-project">Ajouté</span>
        </div>
      </div>
    `,
    roles_list_text: `- [TEST] Chef de projet (Ajouté)`,
  };
}

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[send-test-email] Démarrage de l\'envoi d\'email de test');

  try {
    // Vérifier la configuration minimale
    if (!SMTP_API_URL || !SMTP_API_KEY || !SMTP_FROM) {
      console.error('[send-test-email] Configuration API manquante');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration API manquante',
          details: 'Veuillez configurer EDGE_SMTP_API_URL, EDGE_SMTP_API_KEY et EDGE_SMTP_FROM dans les secrets Supabase'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de la configuration utilisée
    console.log('[send-test-email] Configuration:', {
      apiUrl: SMTP_API_URL,
      from: SMTP_FROM,
    });

    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le body de la requête
    const { template_id } = await req.json();
    
    if (!template_id) {
      return new Response(
        JSON.stringify({ error: 'template_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer le client Supabase avec le token de l'utilisateur
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Créer le client Supabase avec la clé service role pour lire les templates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Récupérer l'utilisateur connecté
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('[send-test-email] Erreur authentification:', userError);
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le profil de l'utilisateur
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const userEmail = profile?.email || user.email || '';
    const userFirstName = profile?.first_name || '';
    const userLastName = profile?.last_name || '';

    console.log(`[send-test-email] Utilisateur: ${userEmail}`);

    // Récupérer le template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      console.error('[send-test-email] Template non trouvé:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-test-email] Template: ${template.name}`);

    // Générer les données de test
    const testVariables = generateTestData(userEmail, userFirstName, userLastName);

    // Fusionner le template avec les variables de test
    const htmlBody = mergeTemplate(template.body_html, testVariables);
    const textBody = template.body_text ? mergeTemplate(template.body_text, testVariables) : undefined;
    const subject = `[TEST] ${mergeTemplate(template.subject, testVariables)}`;

    // Envoyer l'email de test via l'API HTTP
    console.log(`[send-test-email] Envoi email de test à ${userEmail}...`);
    
    await sendEmailViaApi({
      from: SMTP_FROM!,
      to: userEmail,
      subject: subject,
      html: htmlBody,
      text: textBody,
    });

    console.log(`[send-test-email] Email de test envoyé avec succès à ${userEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email de test envoyé à ${userEmail}`,
        recipient: userEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[send-test-email] Erreur:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
