
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ComponentType } from "https://deno.land/x/ical@v1.1.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calendarUrl, startDate } = await req.json();
    console.log('Fetching calendar events from:', calendarUrl);
    console.log('Start date:', startDate);

    if (!calendarUrl) {
      throw new Error('Calendar URL is required');
    }

    // Récupérer le contenu du calendrier ICS
    const response = await fetch(calendarUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const icsData = await response.text();
    console.log('Calendar data fetched successfully');

    // Parser le contenu ICS
    const ical = await import('https://deno.land/x/ical@v1.1.2/mod.ts');
    const calendar = ical.parseICS(icsData);
    console.log('Calendar data parsed successfully');

    // Convertir les événements en format attendu
    const events = [];
    const compareDate = new Date(startDate);

    for (const key in calendar) {
      const event = calendar[key];
      if (event.type === ComponentType.VEVENT) {
        const startTime = new Date(event.start);
        
        // Ne garder que les événements à partir de la date de début
        if (startTime >= compareDate) {
          const endTime = new Date(event.end);
          const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // Durée en minutes

          events.push({
            id: event.uid,
            title: event.summary,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: duration
          });
        }
      }
    }

    console.log(`Found ${events.length} events from ${startDate}`);

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-calendar-events:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
