
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Récupération de la clé API depuis le corps de la requête
    const { apiKey } = await req.json();

    if (!apiKey) {
      throw new Error('Clé API non fournie');
    }

    // Test de la connexion avec l'API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Say "Connection successful" if you receive this message.'
          }
        ],
        max_tokens: 10,
      }),
    });

    const data = await response.json();

    if (response.status !== 200) {
      throw new Error(`Erreur API: ${data.error?.message || 'Erreur inconnue'}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Connexion à l\'API OpenAI réussie',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Une erreur est survenue lors du test de connexion',
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
