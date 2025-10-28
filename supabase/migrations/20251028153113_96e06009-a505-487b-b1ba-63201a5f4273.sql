-- Phase 1 : Création des tables pour l'API Gateway

-- Table api_tokens pour stocker les tokens d'API techniques
CREATE TABLE api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  scopes JSONB DEFAULT '[]'::JSONB,
  allowed_filters JSONB DEFAULT '{}'::JSONB
);

-- Index pour la recherche rapide par token
CREATE INDEX idx_api_tokens_token ON api_tokens(token);
CREATE INDEX idx_api_tokens_active ON api_tokens(is_active) WHERE is_active = TRUE;

-- Table api_logs pour enregistrer les appels API
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES api_tokens(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_logs_token_id ON api_logs(token_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);

-- RLS : seuls les admins peuvent gérer les tokens
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage API tokens"
ON api_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS : seuls les admins peuvent voir les logs
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view API logs"
ON api_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);