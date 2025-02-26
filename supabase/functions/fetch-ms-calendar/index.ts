
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  accessToken: string;
  startDate: string;
  endDate: string;
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

    // Appel à Microsoft Graph
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${start}&endDateTime=${end}&$select=subject,start,end`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Microsoft Graph: ${response.statusText}`);
    }

    const data = await response.json();

    // Conversion des événements au format attendu par le frontend
    const events = data.value.map((event: any) => ({
      id: event.id,
      title: event.subject,
      startTime: new Date(event.start.dateTime + 'Z'),
      endTime: new Date(event.end.dateTime + 'Z'),
      duration: Math.round((new Date(event.end.dateTime + 'Z').getTime() - new Date(event.start.dateTime + 'Z').getTime()) / (1000 * 60)),
      selected: true
    }));

    console.log(`✅ ${events.length} événements récupérés`);

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
