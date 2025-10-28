import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, x-client-info, apikey, content-type',
};

// Fonction pour hasher le token avec SHA-256
async function hashToken(token: string): Promise<string> {
  const hashedBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return Array.from(new Uint8Array(hashedBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Fonction de validation du token API
async function validateApiToken(token: string, supabase: any) {
  const tokenHash = await hashToken(token);
  
  const { data, error } = await supabase
    .from('api_tokens')
    .select('*')
    .eq('token', tokenHash)
    .eq('is_active', true)
    .single();
    
  if (error || !data) {
    console.log('Token validation failed:', error?.message);
    return null;
  }
  
  // Vérifier l'expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.log('Token expired');
    return null;
  }
  
  // Mettre à jour last_used_at de manière asynchrone
  supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => console.log('Token last_used_at updated'));
    
  return data;
}

// Logger les appels API
async function logApiCall(
  supabase: any,
  tokenId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  req: Request
) {
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  await supabase.from('api_logs').insert({
    token_id: tokenId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

// Vérifier si le token a accès à un projet spécifique
function hasProjectAccess(tokenScopes: any, projectId: string): boolean {
  if (!tokenScopes || !tokenScopes.project_ids) return true; // Pas de restriction
  return tokenScopes.project_ids.includes(projectId);
}

// Handler pour GET /api/projects - Liste des projets
async function getProjectsList(params: any, scopes: any, supabase: any) {
  let query = supabase
    .from('projects')
    .select(`
      id, title, description, status, lifecycle_status,
      project_manager, project_manager_id, start_date, end_date,
      pole_id, direction_id, service_id, suivi_dgs, priority,
      poles(name),
      directions(name),
      services(name)
    `, { count: 'exact' });
  
  // Appliquer les scopes du token
  if (scopes.pole_ids && scopes.pole_ids.length > 0) {
    query = query.in('pole_id', scopes.pole_ids);
  }
  if (scopes.direction_ids && scopes.direction_ids.length > 0) {
    query = query.in('direction_id', scopes.direction_ids);
  }
  if (scopes.project_ids && scopes.project_ids.length > 0) {
    query = query.in('id', scopes.project_ids);
  }
  
  // Appliquer les filtres de la requête
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.lifecycle_status) {
    query = query.eq('lifecycle_status', params.lifecycle_status);
  }
  if (params.pole_id) {
    query = query.eq('pole_id', params.pole_id);
  }
  if (params.direction_id) {
    query = query.eq('direction_id', params.direction_id);
  }
  if (params.service_id) {
    query = query.eq('service_id', params.service_id);
  }
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`);
  }
  if (params.suivi_dgs !== undefined) {
    query = query.eq('suivi_dgs', params.suivi_dgs === 'true');
  }
  
  // Pagination
  const limit = Math.min(parseInt(params.limit) || 50, 100); // Max 100
  const offset = parseInt(params.offset) || 0;
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching projects:', error);
    return {
      status: 500,
      data: { error: 'Failed to fetch projects', details: error.message }
    };
  }
  
  return {
    status: 200,
    data: {
      data,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    }
  };
}

// Handler pour GET /api/projects/:id - Détails d'un projet
async function getProjectDetails(projectId: string, scopes: any, supabase: any) {
  if (!hasProjectAccess(scopes, projectId)) {
    return {
      status: 403,
      data: { error: 'Access denied to this project' }
    };
  }
  
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(`
      id, title, description, status, lifecycle_status,
      project_manager, project_manager_id, start_date, end_date,
      pole_id, direction_id, service_id, suivi_dgs, priority,
      progress, last_review_date, created_at, updated_at,
      poles(name),
      directions(name),
      services(name)
    `)
    .eq('id', projectId)
    .single();
  
  if (projectError) {
    return {
      status: projectError.code === 'PGRST116' ? 404 : 500,
      data: { error: 'Project not found or error fetching details' }
    };
  }
  
  // Récupérer la dernière revue
  const { data: lastReview } = await supabase
    .from('latest_reviews')
    .select('weather, progress, completion, created_at, comment')
    .eq('project_id', projectId)
    .single();
  
  // Compter les membres de l'équipe
  const { count: teamCount } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
  
  // Compter les tâches
  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
  
  // Compter les risques
  const { count: risksCount } = await supabase
    .from('risks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
  
  return {
    status: 200,
    data: {
      project,
      last_review: lastReview || null,
      statistics: {
        team_members: teamCount || 0,
        tasks: tasksCount || 0,
        risks: risksCount || 0
      }
    }
  };
}

// Handler pour GET /api/projects/:id/team - Équipe d'un projet
async function getProjectTeam(projectId: string, scopes: any, supabase: any) {
  if (!hasProjectAccess(scopes, projectId)) {
    return {
      status: 403,
      data: { error: 'Access denied to this project' }
    };
  }
  
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      user_id,
      role,
      created_at,
      profiles(email, first_name, last_name)
    `)
    .eq('project_id', projectId);
  
  if (error) {
    return {
      status: 500,
      data: { error: 'Failed to fetch team members' }
    };
  }
  
  const formattedData = data.map((member: any) => ({
    user_id: member.user_id,
    email: member.profiles?.email,
    first_name: member.profiles?.first_name,
    last_name: member.profiles?.last_name,
    role: member.role,
    joined_at: member.created_at
  }));
  
  return {
    status: 200,
    data: { data: formattedData }
  };
}

// Handler pour GET /api/projects/:id/tasks - Tâches d'un projet
async function getProjectTasks(projectId: string, params: any, scopes: any, supabase: any) {
  if (!hasProjectAccess(scopes, projectId)) {
    return {
      status: 403,
      data: { error: 'Access denied to this project' }
    };
  }
  
  let query = supabase
    .from('tasks')
    .select('id, title, description, status, start_date, due_date, assignee, parent_task_id, created_at, updated_at')
    .eq('project_id', projectId);
  
  // Appliquer les filtres
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.assignee) {
    query = query.eq('assignee', params.assignee);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return {
      status: 500,
      data: { error: 'Failed to fetch tasks' }
    };
  }
  
  return {
    status: 200,
    data: { data }
  };
}

// Handler pour GET /api/projects/:id/risks - Risques d'un projet
async function getProjectRisks(projectId: string, params: any, scopes: any, supabase: any) {
  if (!hasProjectAccess(scopes, projectId)) {
    return {
      status: 403,
      data: { error: 'Access denied to this project' }
    };
  }
  
  let query = supabase
    .from('risks')
    .select('id, description, probability, severity, status, mitigation_plan, created_at, updated_at')
    .eq('project_id', projectId);
  
  // Appliquer les filtres
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.severity) {
    query = query.eq('severity', params.severity);
  }
  if (params.probability) {
    query = query.eq('probability', params.probability);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return {
      status: 500,
      data: { error: 'Failed to fetch risks' }
    };
  }
  
  return {
    status: 200,
    data: { data }
  };
}

// Handler principal pour les endpoints /api/projects
async function handleProjectsEndpoint(req: Request, path: string, params: any, tokenData: any, supabase: any) {
  const scopes = tokenData.scopes || {};
  
  // GET /api/projects - Liste
  if (req.method === 'GET' && path === '/api/projects') {
    return await getProjectsList(params, scopes, supabase);
  }
  
  // GET /api/projects/:id - Détail
  const projectIdMatch = path.match(/^\/api\/projects\/([0-9a-f-]{36})$/);
  if (req.method === 'GET' && projectIdMatch) {
    return await getProjectDetails(projectIdMatch[1], scopes, supabase);
  }
  
  // GET /api/projects/:id/team
  const teamMatch = path.match(/^\/api\/projects\/([0-9a-f-]{36})\/team$/);
  if (req.method === 'GET' && teamMatch) {
    return await getProjectTeam(teamMatch[1], scopes, supabase);
  }
  
  // GET /api/projects/:id/tasks
  const tasksMatch = path.match(/^\/api\/projects\/([0-9a-f-]{36})\/tasks$/);
  if (req.method === 'GET' && tasksMatch) {
    return await getProjectTasks(tasksMatch[1], params, scopes, supabase);
  }
  
  // GET /api/projects/:id/risks
  const risksMatch = path.match(/^\/api\/projects\/([0-9a-f-]{36})\/risks$/);
  if (req.method === 'GET' && risksMatch) {
    return await getProjectRisks(risksMatch[1], params, scopes, supabase);
  }
  
  return {
    status: 404,
    data: { error: 'Endpoint not found' }
  };
}

// Fonction principale
serve(async (req: Request) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  let statusCode = 500;
  let endpoint = '';
  let tokenId = '';
  
  try {
    const url = new URL(req.url);
    const rawPath = url.pathname;
    // Supprime le préfixe de la fonction Edge: /functions/v{n}/{function-name}
    const cleanedPath = rawPath.replace(/^\/functions\/v\d+\/[^\/]+/, '');
    endpoint = cleanedPath || '/';
    const params = Object.fromEntries(url.searchParams);
    
    // 1. Extraire le token
    const apiKey = req.headers.get('X-API-Key') || 
                   req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      statusCode = 401;
      const response = new Response(
        JSON.stringify({ error: 'API key required. Use X-API-Key header or Authorization: Bearer token' }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
      return response;
    }
    
    // 2. Valider le token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const tokenData = await validateApiToken(apiKey, supabase);
    
    if (!tokenData) {
      statusCode = 401;
      const response = new Response(
        JSON.stringify({ error: 'Invalid, expired or inactive API key' }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
      return response;
    }
    
    tokenId = tokenData.id;
    
    // 3. Router la requête
    let result;
    if (endpoint.startsWith('/api/projects')) {
      result = await handleProjectsEndpoint(req, endpoint, params, tokenData, supabase);
    } else {
      result = {
        status: 404,
        data: { error: 'Endpoint not found. Available endpoints: /api/projects' }
      };
    }
    
    statusCode = result.status;
    const responseTimeMs = Date.now() - startTime;
    
    // 4. Logger l'appel
    await logApiCall(supabase, tokenId, rawPath, req.method, statusCode, responseTimeMs, req);
    
    return new Response(
      JSON.stringify(result.data),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
    
  } catch (error) {
    console.error('API Gateway error:', error);
    statusCode = 500;
    
    const responseTimeMs = Date.now() - startTime;
    
    // Logger l'erreur si possible
    if (tokenId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await logApiCall(supabase, tokenId, endpoint, req.method, statusCode, responseTimeMs, req);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
