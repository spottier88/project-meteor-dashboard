
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { UserRole } from "../../../src/types/user.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteUserBody {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  projectId?: string; // ID du projet pour l'ajout automatique
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

    // Ajouter le rôle demandé
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authUser.user.id,
      role,
    });

    if (roleError) {
      throw roleError;
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

    // Envoyer un email de réinitialisation de mot de passe
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (resetError) {
      throw resetError;
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
