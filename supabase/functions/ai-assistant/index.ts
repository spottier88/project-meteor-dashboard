
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
      projectId,
      promptType = 'general',
      promptSection = 'general',
      maxTokens = 1500,
      temperature = 0.7,
      saveFrameworkNote = false
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

    // Si c'est une note de cadrage et que saveFrameworkNote est vrai, sauvegarder la note
    if (promptType === 'framework_note' && saveFrameworkNote && projectId) {
      try {
        // Structurer le contenu de la note (à adapter selon vos besoins)
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
