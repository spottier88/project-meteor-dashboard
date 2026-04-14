/**
 * Edge Function : invite-user
 * @description Invite un utilisateur dans l'application.
 * Crée le compte via Supabase Auth, attribue un rôle,
 * et envoie un email d'invitation via le microservice smtp-api.
 *
 * Configuration :
 * - EDGE_SMTP_API_URL : URL de l'API d'envoi (ex: http://smtp-api:3000/send)
 * - EDGE_SMTP_API_KEY : Clé API pour l'authentification
 * - EDGE_SMTP_FROM : Adresse expéditeur
 * - EDGE_APP_URL : URL de l'application (pour le lien dans l'email)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.42.0";

// Définir le type UserRole directement dans le fichier
type UserRole = "admin" | "chef_projet" | "manager" | "membre";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Configuration API d'envoi d'email via variables d'environnement
const SMTP_API_URL = Deno.env.get("EDGE_SMTP_API_URL");
const SMTP_API_KEY = Deno.env.get("EDGE_SMTP_API_KEY");
const SMTP_FROM = Deno.env.get("EDGE_SMTP_FROM");
const APP_URL = Deno.env.get("EDGE_APP_URL") || "https://meteor.app";

interface InviteUserBody {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  projectId?: string; // ID du projet pour l'ajout automatique
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
  console.log(`[invite-user] Appel API smtp-api pour ${params.to}...`);

  const response = await fetch(SMTP_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SMTP_API_KEY!,
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || "",
    }),
  });

  const result: SmtpApiResponse = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || `Erreur API smtp-api: ${response.status}`);
  }

  console.log(`[invite-user] Email envoyé via API à ${params.to}`);
}

/**
 * Construit le contenu HTML de l'email d'invitation
 */
function buildInvitationEmailHtml(params: {
  firstName?: string;
  lastName?: string;
  actionLink: string;
}): string {
  const displayName = [params.firstName, params.lastName].filter(Boolean).join(" ") || "Utilisateur";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation - Meteor</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- En-tête -->
          <tr>
            <td style="background-color:#1e40af;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">Meteor</h1>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Bonjour ${displayName},</h2>
              <p style="margin:0 0 16px;color:#475569;font-size:16px;line-height:1.5;">
                Vous avez été invité(e) à rejoindre l'application <strong>Meteor</strong>.
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:16px;line-height:1.5;">
                Cliquez sur le bouton ci-dessous pour accéder à votre compte :
              </p>
              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${params.actionLink}" 
                       style="display:inline-block;background-color:#1e40af;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">
                      Accéder à Meteor
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur&nbsp;:<br>
                <a href="${params.actionLink}" style="color:#1e40af;word-break:break-all;">${params.actionLink}</a>
              </p>
            </td>
          </tr>
          <!-- Pied de page -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Cet email a été envoyé automatiquement par Meteor.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variables d'environnement manquantes");
    }

    const { email, firstName, lastName, role, projectId }: InviteUserBody = await req.json();

    if (!email) {
      throw new Error("Email requis");
    }

    if (!role) {
      throw new Error("Rôle requis");
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    // Si l'utilisateur existe et qu'un projectId est fourni, ajouter l'utilisateur au projet
    if (existingUser && projectId) {
      // Vérifier si l'utilisateur est déjà membre du projet
      const { data: existingMember, error: memberLookupError } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (memberLookupError) {
        throw memberLookupError;
      }

      // Si l'utilisateur n'est pas déjà membre, l'ajouter
      if (!existingMember) {
        const { error: memberInsertError } = await supabase
          .from("project_members")
          .insert({
            project_id: projectId,
            user_id: existingUser.id,
          });

        if (memberInsertError) {
          throw memberInsertError;
        }
      }

      return new Response(JSON.stringify({ 
        message: "Utilisateur existant ajouté au projet", 
        user_id: existingUser.id 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sinon, procéder à l'invitation
    let generatedPassword = "";
    for (let i = 0; i < 10; i++) {
      generatedPassword += Math.random().toString(36).substring(2, 4);
    }

    const { data: authUser, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (signupError) {
      throw signupError;
    }

    if (!authUser.user) {
      throw new Error("Erreur lors de la création de l'utilisateur");
    }

    // Vérifier si le rôle existe déjà pour cet utilisateur
    const { data: existingRole, error: roleCheckError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", authUser.user.id)
      .eq("role", role)
      .maybeSingle();

    if (roleCheckError) {
      throw roleCheckError;
    }

    // Ajouter le rôle demandé seulement s'il n'existe pas déjà
    if (!existingRole) {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authUser.user.id,
        role,
      });

      if (roleError) {
        throw roleError;
      }
    }

    // Si un projectId est fourni, ajouter l'utilisateur au projet
    if (projectId) {
      const { error: projectMemberError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: authUser.user.id,
        });

      if (projectMemberError) {
        throw projectMemberError;
      }
    }

    // Générer un magic link pour l'invitation
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: APP_URL,
      },
    });

    if (linkError) {
      throw linkError;
    }

    // Extraire le lien d'action depuis la réponse
    const actionLink = linkData?.properties?.action_link || APP_URL;

    // Envoyer l'email d'invitation via le microservice smtp-api
    if (SMTP_API_URL && SMTP_API_KEY && SMTP_FROM) {
      const htmlContent = buildInvitationEmailHtml({
        firstName,
        lastName,
        actionLink,
      });

      await sendEmailViaApi({
        from: SMTP_FROM,
        to: email,
        subject: "Invitation à rejoindre Meteor",
        html: htmlContent,
        text: `Bonjour ${[firstName, lastName].filter(Boolean).join(" ") || "Utilisateur"}, vous avez été invité(e) à rejoindre Meteor. Accédez à votre compte via ce lien : ${actionLink}`,
      });
    } else {
      console.warn("[invite-user] Configuration smtp-api manquante — email d'invitation non envoyé");
    }

    return new Response(JSON.stringify({ success: true, user: authUser.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erreur:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message || "Une erreur est survenue",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
