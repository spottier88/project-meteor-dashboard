
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

// Configuration CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier si la requête est authentifiée
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Vérifier si l'utilisateur est administrateur
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Erreur d'authentification:", userError);
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Vérifier si l'utilisateur est admin
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Opération non autorisée" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Traiter la demande d'invitation
    const { email, firstName, lastName, role } = await req.json() as InviteUserRequest;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Tentative d'invitation de l'utilisateur: ${email}`);

    // Inviter l'utilisateur via l'API admin
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      console.error("Erreur lors de l'invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Utilisateur invité avec succès:", inviteData);

    // Préparer une création anticipée du profil si firstName ou lastName sont fournis
    if (firstName || lastName) {
      const userId = inviteData.user.id;
      
      // Vérifier si un profil existe déjà
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      
      if (!existingProfile) {
        // Créer le profil avec les informations fournies
        const { error: profileError } = await adminClient
          .from("profiles")
          .insert({
            id: userId,
            email: email,
            first_name: firstName || null,
            last_name: lastName || null,
          });
          
        if (profileError) {
          console.error("Erreur lors de la création du profil:", profileError);
        }
      }

      // Ajouter le rôle spécifié si fourni
      if (role) {
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({
            user_id: userId,
            role: role,
          });
          
        if (roleError) {
          console.error("Erreur lors de l'ajout du rôle:", roleError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: inviteData.user }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
