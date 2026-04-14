
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
//import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { createClient } from "npm:@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  accessToken: string;
  startDate: string;
  endDate: string;
}

// Fonction pour extraire le code projet de la description
function extractProjectCode(description: string): string | null {
  // Rechercher un pattern #P-XXXX# dans la description
  const projectCodeRegex = /#(P-[A-Za-z0-9]{4})#/;
  const match = description.match(projectCodeRegex);
  return match ? match[1] : null;
}

// Fonction pour extraire le code du type d'activité de la description
function extractActivityTypeCode(description: string): string | null {
  // Rechercher un pattern #A-XXX# dans la description
  const activityTypeCodeRegex = /#(A-[A-Za-z0-9_]+)#/;
  const match = description.match(activityTypeCodeRegex);
  return match ? match[1] : null;
}

// Nouvelle fonction pour récupérer tous les événements avec pagination
async function fetchAllEvents(accessToken: string, startDate: string, endDate: string) {
  const events = [];
  let nextLink = null;
  
  // URL initiale pour la première page de résultats
  let url = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startDate}&endDateTime=${endDate}&$select=subject,start,end,body`;
  
  console.log(`🔍 Début de la récupération des événements du ${startDate} au ${endDate}`);
  
  do {
    // Utiliser l'URL de base pour la première requête ou nextLink pour les pages suivantes
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur Microsoft Graph (${response.status}): ${errorText}`);
      throw new Error(`Erreur Microsoft Graph: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    
    // Ajouter les événements de cette page au tableau final
    if (data.value && Array.isArray(data.value)) {
      console.log(`✅ Récupération de ${data.value.length} événements supplémentaires`);
      events.push(...data.value);
    }
    
    // Vérifier s'il y a une page suivante
    nextLink = data['@odata.nextLink'];
    
    // Si oui, utiliser cette URL pour la prochaine itération
    if (nextLink) {
      url = nextLink;
      console.log(`🔄 Chargement de la page suivante...`);
    }
  } while (nextLink);
  
  console.log(`🎉 Récupération terminée: ${events.length} événements au total`);
  return events;
}

serve(async (req) => {
  // Gestion du CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { accessToken, startDate, endDate } = await req.json() as RequestBody

    if (!accessToken || !startDate || !endDate) {
      throw new Error("Paramètres manquants")
    }

    console.log(`🔍 Récupération des événements du ${startDate} au ${endDate}`)

    // Formater les dates pour Microsoft Graph
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    // Récupérer tous les événements avec pagination
    const allEvents = await fetchAllEvents(accessToken, start, end);

    // Conversion des événements au format attendu par le frontend
    const events = allEvents.map((event: any) => {
      // Extraire le contenu du corps de l'événement
      const description = event.body?.content || '';
      
      // Extraire le code projet s'il existe
      const projectCode = extractProjectCode(description);
      
      // Extraire le code du type d'activité s'il existe
      const activityTypeCode = extractActivityTypeCode(description);
      
      return {
        id: event.id,
        title: event.subject,
        description: description,
        startTime: new Date(event.start.dateTime + 'Z'),
        endTime: new Date(event.end.dateTime + 'Z'),
        duration: Math.round((new Date(event.end.dateTime + 'Z').getTime() - new Date(event.start.dateTime + 'Z').getTime()) / (1000 * 60)),
        selected: true,
        projectCode: projectCode,
        activityTypeCode: activityTypeCode,
      };
    });

    console.log(`✅ ${events.length} événements récupérés au total`);

    return new Response(
      JSON.stringify({ events }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
