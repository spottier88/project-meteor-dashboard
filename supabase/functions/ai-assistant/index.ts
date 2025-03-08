
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Définition des headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer le client Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorisation requise');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Récupérer l'utilisateur
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Récupérer le corps de la requête
    const { 
      messages,
      conversationId,
      maxTokens = 1500,
      temperature = 0.7
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages invalides');
    }

    // Récupérer la clé API OpenAI depuis les paramètres de l'application
    const { data: openaiSettings, error: openaiError } = await supabaseClient
      .from("application_settings")
      .select("*")
      .eq("type", "openai")
      .eq("key", "api_key")
      .single();

    if (openaiError || !openaiSettings) {
      throw new Error('Clé API OpenAI non trouvée');
    }

    const openaiApiKey = openaiSettings.value;

    // Appel à l'API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur API OpenAI: ${error.error?.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Si un ID de conversation est fourni, sauvegarder le message dans la base de données
    if (conversationId) {
      // Vérifier que la conversation appartient à l'utilisateur
      const { data: conversation, error: conversationError } = await supabaseClient
        .from("ai_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (conversationError || !conversation) {
        throw new Error('Conversation non trouvée ou accès non autorisé');
      }

      // Sauvegarder le message de l'assistant
      const { error: insertError } = await supabaseClient
        .from("ai_messages")
        .insert({
          conversation_id: conversationId,
          role: assistantMessage.role,
          content: assistantMessage.content,
        });

      if (insertError) {
        console.error('Erreur lors de la sauvegarde du message:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: data.usage,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Une erreur est survenue lors du traitement de la requête',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
