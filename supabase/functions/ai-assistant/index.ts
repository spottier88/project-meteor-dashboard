
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Définition des headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Templates de secours par défaut pour les sections de note de cadrage
// Alignés avec les champs du formulaire ProjectFormStep4
const fallbackTemplates: Record<string, Record<string, string>> = {
  framework_note: {
    general: `Vous êtes un assistant spécialisé dans la rédaction de notes de cadrage de projets. Votre mission est de générer une note de cadrage complète et professionnelle en vous basant sur les informations fournies par l'utilisateur.
    
    Veuillez produire une note de cadrage concise, structurée et professionnelle. Utilisez un ton formel et soyez précis dans votre formulation.`,
    
    contexte: `Vous êtes un assistant spécialisé dans l'analyse contextuelle de projets.
    En vous basant sur les informations fournies, rédigez une section "Contexte" claire et précise pour une note de cadrage de projet.
    
    Le contexte doit couvrir:
    - L'environnement dans lequel s'inscrit le projet
    - Les éléments historiques pertinents
    - Les contraintes externes connues
    - Les motivations principales du projet`,
    
    parties_prenantes: `Vous êtes un assistant spécialisé dans l'identification des parties prenantes de projets.
    En vous basant sur les informations fournies, rédigez une section "Parties prenantes" claire et détaillée pour une note de cadrage de projet.
    
    Identifiez et décrivez:
    - Les parties prenantes internes et externes
    - Leur rôle et niveau d'implication dans le projet
    - Leurs attentes et besoins spécifiques
    - Les modes de communication privilégiés`,
    
    organisation: `Vous êtes un assistant spécialisé dans la structuration organisationnelle de projets.
    En vous basant sur les informations fournies, rédigez une section "Gouvernance" claire et précise pour une note de cadrage de projet.
    
    La gouvernance doit préciser:
    - L'organisation du projet (comités, instances de pilotage)
    - Les rôles et responsabilités des acteurs clés
    - Les processus de décision et d'escalade
    - La fréquence et le format des points de suivi`,
    
    objectifs: `Vous êtes un assistant spécialisé dans la définition d'objectifs pour des projets. 
    En vous basant sur les informations fournies, rédigez une section "Objectifs" claire et concise pour une note de cadrage de projet.
    
    Les objectifs doivent être SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis).
    Incluez des objectifs principaux et secondaires si pertinent.`,
    
    planning: `Vous êtes un assistant spécialisé dans la planification de projets.
    En vous basant sur les informations fournies, rédigez une section "Planning prévisionnel" claire et structurée pour une note de cadrage de projet.
    
    Le planning doit inclure:
    - Les grandes phases du projet
    - Les jalons et échéances clés
    - Les dépendances entre les phases
    - Les marges de manœuvre et points de contrôle`,
    
    livrables: `Vous êtes un assistant spécialisé dans la définition des livrables de projets.
    En vous basant sur les informations fournies, rédigez une section "Livrables attendus" claire et détaillée pour une note de cadrage de projet.
    
    Précisez pour chaque livrable:
    - La description et le contenu du livrable
    - Les critères de qualité et d'acceptation
    - Les dates de livraison prévues
    - Les responsables de production et validation`
  }
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
    let usedFallbackTemplate = false;
    
    if (promptType === 'framework_note') {
      // Tentative de récupération du template depuis la base de données
      const { data: promptTemplate, error: promptError } = await supabaseClient
        .from("ai_prompt_templates")
        .select("*")
        .eq("type", promptType)
        .eq("section", promptSection)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (promptError || !promptTemplate) {
        if (promptError) {
          console.error(`Erreur lors de la récupération du template de prompt (type: ${promptType}, section: ${promptSection}):`, promptError);
        } else {
          console.log(`Aucun template actif trouvé pour ${promptType}/${promptSection}`);
        }
        
        // Utilisation du template de secours
        if (fallbackTemplates[promptType] && fallbackTemplates[promptType][promptSection]) {
          // console.log(`Utilisation du template de secours pour ${promptType}/${promptSection}`);
          usedFallbackTemplate = true;
          
          // Ajouter le template de secours comme message système au début des messages
          finalMessages = [
            { role: 'system', content: fallbackTemplates[promptType][promptSection] },
            ...messages
          ];
          
          // Créer une notification pour les administrateurs
          try {
            await supabaseClient
              .from("notifications")
              .insert({
                title: "Template de prompt manquant",
                content: `Un template de prompt actif est manquant pour le type "${promptType}" et la section "${promptSection}". Un template de secours a été utilisé à la place.`,
                type: "system",
                publication_date: new Date().toISOString(),
                published: true
              });
          } catch (notificationError) {
            console.error("Erreur lors de la création de la notification:", notificationError);
          }
        } else {
          console.error(`Aucun template de secours disponible pour ${promptType}/${promptSection}`);
        }
      } else if (promptTemplate) {
        // Ajouter le template comme message système au début des messages
        finalMessages = [
          { role: 'system', content: promptTemplate.template },
          ...messages
        ];
      }
        
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

    // Vérifier que nous avons un message système pour les notes de cadrage
    if (promptType === 'framework_note' && !finalMessages.some(msg => msg.role === 'system')) {
      // console.log(`Aucun template trouvé pour ${promptType}/${promptSection}, utilisation du template de secours générique`);
      
      // Utiliser un template de secours générique si rien n'a été trouvé
      finalMessages = [
        { 
          role: 'system', 
          content: `Vous êtes un assistant spécialisé dans la rédaction de notes de cadrage de projets.
          Veuillez générer une section "${promptSection}" concise, structurée et professionnelle en vous basant sur les informations fournies.`
        },
        ...finalMessages
      ];
      
      usedFallbackTemplate = true;
    }

    // Appel à l'API OpenAI
    try {
      // console.log(`Appel OpenAI pour ${promptType}/${promptSection} (template de secours: ${usedFallbackTemplate ? 'Oui' : 'Non'})`);
      
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
        console.error('Erreur API OpenAI:', errorJson);
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

      // Si un ID de conversation est fourni, sauvegarder les messages dans la base de données
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
          try {
            // Sauvegarder le message utilisateur (le dernier message avec role='user')
            const userMessages = messages.filter(msg => msg.role === 'user');
            if (userMessages.length > 0) {
              const lastUserMessage = userMessages[userMessages.length - 1];
              const { error: userInsertError } = await supabaseClient
                .from("ai_messages")
                .insert({
                  conversation_id: conversationId,
                  role: 'user',
                  content: lastUserMessage.content,
                });

              if (userInsertError) {
                console.error('Erreur lors de la sauvegarde du message utilisateur:', userInsertError);
              }
            }

            // Sauvegarder le message de l'assistant
            const { error: assistantInsertError } = await supabaseClient
              .from("ai_messages")
              .insert({
                conversation_id: conversationId,
                role: assistantMessage.role,
                content: assistantMessage.content,
              });

            if (assistantInsertError) {
              console.error('Erreur lors de la sauvegarde du message assistant:', assistantInsertError);
            }
          } catch (saveError) {
            console.error('Erreur lors de la sauvegarde des messages:', saveError);
            // On continue l'exécution même en cas d'erreur de sauvegarde
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
          usedFallbackTemplate: usedFallbackTemplate
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (openaiError: unknown) {
      console.error('Erreur lors de l\'appel à l\'API OpenAI:', openaiError);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de l\'appel à l\'API OpenAI', 
          details: openaiError instanceof Error ? openaiError.message : 'Erreur inconnue'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: unknown) {
    console.error('Erreur lors du traitement de la requête:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Une erreur est survenue lors du traitement de la requête',
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
