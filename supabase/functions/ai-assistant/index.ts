
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
      return new Response(
        JSON.stringify({ 
          error: 'Autorisation requise',
          details: 'Aucun header d\'autorisation fourni'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
      return new Response(
        JSON.stringify({ 
          error: 'Utilisateur non authentifié',
          details: userError ? userError.message : 'Utilisateur introuvable'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ 
          error: 'Format de requête invalide',
          details: 'Le corps de la requête n\'est pas un JSON valide'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Récupérer le corps de la requête
    const { 
      messages,
      conversationId,
      projectId,
      promptType = 'general',
      promptSection = 'general',
      maxTokens = 1500,
      temperature = 0.7,
      saveFrameworkNote = false
    } = requestBody;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Messages invalides',
          details: 'Les messages doivent être un tableau non vide'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Récupérer la clé API OpenAI depuis les paramètres de l'application
    const { data: openaiSettings, error: openaiError } = await supabaseClient
      .from("application_settings")
      .select("*")
      .eq("type", "openai")
      .eq("key", "api_key")
      .single();

    if (openaiError || !openaiSettings) {
      console.error('Erreur lors de la récupération de la clé API OpenAI:', openaiError);
      return new Response(
        JSON.stringify({ 
          error: 'Clé API OpenAI non trouvée',
          details: openaiError ? openaiError.message : 'Paramètre d\'application manquant'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openaiApiKey = openaiSettings.value;
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Clé API OpenAI invalide',
          details: 'La clé API OpenAI est vide ou non définie'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Si c'est une demande de note de cadrage, récupérer le template de prompt actif
    let finalMessages = [...messages];
    
    if (promptType === 'framework_note') {
      const { data: promptTemplate, error: promptError } = await supabaseClient
        .from("ai_prompt_templates")
        .select("*")
        .eq("type", promptType)
        .eq("section", promptSection)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (promptError) {
        console.error('Erreur lors de la récupération du template de prompt:', promptError);
      } else if (promptTemplate) {
        // Ajouter le template comme message système au début des messages
        finalMessages = [
          { role: 'system', content: promptTemplate.template },
          ...messages
        ];
        
        // Si un ID de projet est fourni, récupérer les informations du projet
        if (projectId) {
          const { data: project, error: projectError } = await supabaseClient
            .from("projects")
            .select(`
              *,
              project_innovation_scores (*)
            `)
            .eq("id", projectId)
            .single();

          if (!projectError && project) {
            // Ajouter les informations du projet comme premier message utilisateur
            const projectContext = `
              Informations du projet:
              - Titre: ${project.title}
              - Description: ${project.description || 'Non définie'}
              - Chef de projet: ${project.project_manager || 'Non défini'}
              - Date de début: ${project.start_date || 'Non définie'}
              - Date de fin: ${project.end_date || 'Non définie'}
              - Priorité: ${project.priority || 'Non définie'}
              ${project.project_innovation_scores ? `
              - Scores d'innovation:
                - Novateur: ${project.project_innovation_scores.novateur}/5
                - Usager: ${project.project_innovation_scores.usager}/5
                - Ouverture: ${project.project_innovation_scores.ouverture}/5
                - Agilité: ${project.project_innovation_scores.agilite}/5
                - Impact: ${project.project_innovation_scores.impact}/5
              ` : ''}
            `;
            
            finalMessages.splice(1, 0, { 
              role: 'user', 
              content: projectContext
            });
          }
        }
      }
    }

    // Appel à l'API OpenAI
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: finalMessages,
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      });

      if (!openaiResponse.ok) {
        const errorJson = await openaiResponse.json().catch(() => null);
        return new Response(
          JSON.stringify({ 
            error: `Erreur API OpenAI (${openaiResponse.status})`, 
            details: errorJson ? errorJson.error?.message : 'Réponse non valide de l\'API OpenAI'
          }),
          { 
            status: openaiResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await openaiResponse.json();
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
          console.error('Erreur lors de la vérification de la conversation:', conversationError);
          // On continue même si erreur pour le stockage de la conversation
        } else {
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
      }

      // Si c'est une note de cadrage et que saveFrameworkNote est vrai, sauvegarder la note
      if (promptType === 'framework_note' && saveFrameworkNote && projectId) {
        try {
          // Structurer le contenu de la note
          const noteContent = {
            content: assistantMessage.content,
            generated_at: new Date().toISOString(),
            prompt_section: promptSection
          };

          // Insérer la note de cadrage
          const { error: frameworkNoteError } = await supabaseClient
            .from("project_framework_notes")
            .insert({
              project_id: projectId,
              content: noteContent,
              created_by: user.id,
              status: 'draft'
            });

          if (frameworkNoteError) {
            console.error('Erreur lors de la sauvegarde de la note de cadrage:', frameworkNoteError);
          }
        } catch (error) {
          console.error('Erreur lors du traitement de la note de cadrage:', error);
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
    } catch (openaiError) {
      console.error('Erreur lors de l\'appel à l\'API OpenAI:', openaiError);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de l\'appel à l\'API OpenAI', 
          details: openaiError.message || 'Erreur inconnue'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erreur serveur',
        details: error.message || 'Une erreur est survenue lors du traitement de la requête',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
