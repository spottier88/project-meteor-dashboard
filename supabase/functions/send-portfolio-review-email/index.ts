/**
 * @file send-portfolio-review-email/index.ts
 * @description Edge function pour envoyer les emails de notification de revue de portefeuille.
 * Récupère les notifications en attente, charge le modèle d'email, fusionne les variables,
 * et envoie les emails via Resend.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// Configuration CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface pour les données d'événement de notification
interface NotificationEventData {
  review_id: string;
  portfolio_id: string;
  message: string;
  template_id: string | null;
  manager_name: string;
  manager_email: string;
  portfolio_name: string;
  review_subject: string;
  review_date: string;
  project_titles: string[];
}

// Interface pour un template d'email
interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
}

/**
 * Fusionne les variables dans un template
 */
function mergeTemplate(
  template: string,
  variables: Record<string, string | string[]>
): string {
  let result = template;

  // Gestion des listes (project_titles)
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    if (Array.isArray(value)) {
      // Pour les listes, créer des <li> elements pour HTML ou des lignes pour texte
      const listHtml = value.map((item) => `<li>${item}</li>`).join("\n          ");
      result = result.replace(new RegExp(placeholder, "g"), listHtml);
    } else {
      result = result.replace(new RegExp(placeholder, "g"), value);
    }
  });

  // Gestion des conditionnels simples {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (_, variable, content) => {
    const value = variables[variable];
    if (value && (typeof value === "string" ? value.trim() : value.length > 0)) {
      return content;
    }
    return "";
  });

  return result;
}

/**
 * Handler principal de la fonction
 */
const handler = async (req: Request): Promise<Response> => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[send-portfolio-review-email] Démarrage du traitement des notifications");

  try {
    // Vérification de la clé Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-portfolio-review-email] RESEND_API_KEY non configurée");
      return new Response(
        JSON.stringify({ error: "Configuration email manquante" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Création du client Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les notifications de type "portfolio_review" non traitées
    const { data: notifications, error: fetchError } = await supabase
      .from("email_notification_queue")
      .select("*")
      .eq("event_type", "portfolio_review")
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("[send-portfolio-review-email] Erreur récupération notifications:", fetchError);
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log("[send-portfolio-review-email] Aucune notification à traiter");
      return new Response(
        JSON.stringify({ message: "Aucune notification à traiter", processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-portfolio-review-email] ${notifications.length} notification(s) à traiter`);

    // Cache des templates pour éviter les requêtes multiples
    const templateCache = new Map<string, EmailTemplate | null>();

    let successCount = 0;
    let errorCount = 0;

    // Traiter chaque notification
    for (const notification of notifications) {
      try {
        const eventData = notification.event_data as NotificationEventData;
        const templateId = eventData.template_id;

        let template: EmailTemplate | null = null;

        // Charger le template si un ID est fourni
        if (templateId) {
          if (templateCache.has(templateId)) {
            template = templateCache.get(templateId) || null;
          } else {
            const { data: templateData, error: templateError } = await supabase
              .from("email_templates")
              .select("id, code, name, subject, body_html, body_text")
              .eq("id", templateId)
              .eq("is_active", true)
              .single();

            if (templateError) {
              console.warn(`[send-portfolio-review-email] Template ${templateId} non trouvé:`, templateError);
            }
            template = templateData as EmailTemplate || null;
            templateCache.set(templateId, template);
          }
        }

        // Préparer les variables de fusion
        const variables: Record<string, string | string[]> = {
          manager_name: eventData.manager_name || "Cher collaborateur",
          portfolio_name: eventData.portfolio_name || "",
          review_subject: eventData.review_subject || "",
          review_date: eventData.review_date || "",
          project_titles: eventData.project_titles || [],
          message: eventData.message || "",
          app_url: supabaseUrl.replace(".supabase.co", ".lovable.app") || "",
        };

        let emailSubject: string;
        let emailHtml: string;
        let emailText: string | undefined;

        if (template) {
          // Utiliser le template
          emailSubject = mergeTemplate(template.subject, variables);
          emailHtml = mergeTemplate(template.body_html, variables);
          emailText = template.body_text ? mergeTemplate(template.body_text, variables) : undefined;
        } else {
          // Fallback: email simple sans template
          emailSubject = `📋 Revue de projets : ${eventData.review_subject}`;
          emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #4F46E5;">Revue de projets</h1>
              <p>Bonjour ${eventData.manager_name},</p>
              <p>Une revue de projets est organisée pour le portefeuille <strong>${eventData.portfolio_name}</strong>.</p>
              <p><strong>Objet :</strong> ${eventData.review_subject}</p>
              <p><strong>Date :</strong> ${eventData.review_date}</p>
              ${eventData.message ? `<p><strong>Message :</strong> ${eventData.message}</p>` : ""}
              <p>Merci de mettre à jour l'état d'avancement de vos projets.</p>
              <p>Cordialement,<br>L'équipe de gestion de projets</p>
            </div>
          `;
          emailText = `Bonjour ${eventData.manager_name},\n\nUne revue de projets est organisée pour le portefeuille "${eventData.portfolio_name}".\n\nObjet : ${eventData.review_subject}\nDate : ${eventData.review_date}\n\n${eventData.message ? `Message : ${eventData.message}\n\n` : ""}Merci de mettre à jour l'état d'avancement de vos projets.`;
        }

        // Envoyer l'email via Resend
        const { error: sendError } = await resend.emails.send({
          from: Deno.env.get("EMAIL_FROM") || "Gestion de Projets <onboarding@resend.dev>",
          to: [eventData.manager_email],
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        });

        if (sendError) {
          console.error(`[send-portfolio-review-email] Erreur envoi email à ${eventData.manager_email}:`, sendError);
          errorCount++;
          continue;
        }

        // Marquer comme traité
        const { error: updateError } = await supabase
          .from("email_notification_queue")
          .update({
            processed_at: new Date().toISOString(),
            email_sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);

        if (updateError) {
          console.warn(`[send-portfolio-review-email] Erreur mise à jour notification ${notification.id}:`, updateError);
        }

        console.log(`[send-portfolio-review-email] Email envoyé à ${eventData.manager_email}`);
        successCount++;

      } catch (notifError) {
        console.error(`[send-portfolio-review-email] Erreur traitement notification ${notification.id}:`, notifError);
        errorCount++;
      }
    }

    console.log(`[send-portfolio-review-email] Traitement terminé: ${successCount} succès, ${errorCount} erreurs`);

    return new Response(
      JSON.stringify({
        message: "Traitement terminé",
        processed: successCount,
        errors: errorCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[send-portfolio-review-email] Erreur globale:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
