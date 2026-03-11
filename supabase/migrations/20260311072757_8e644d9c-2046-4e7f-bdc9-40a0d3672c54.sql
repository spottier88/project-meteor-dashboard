
-- Table des modèles d'export de note de cadrage
CREATE TABLE public.framing_export_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.framing_export_templates ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les authentifiés
CREATE POLICY "Authenticated users can view active framing export templates"
ON public.framing_export_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- CRUD complet pour les admins
CREATE POLICY "Admins can manage framing export templates"
ON public.framing_export_templates
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role));

-- Bucket Storage pour les fichiers DOCX modèles
INSERT INTO storage.buckets (id, name, public)
VALUES ('framing-export-templates', 'framing-export-templates', false);

-- RLS Storage : lecture pour authentifiés
CREATE POLICY "Authenticated users can read framing export templates"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'framing-export-templates');

-- RLS Storage : écriture pour admins uniquement
CREATE POLICY "Admins can upload framing export templates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'framing-export-templates'
  AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role)
);

CREATE POLICY "Admins can update framing export templates files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'framing-export-templates'
  AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role)
);

CREATE POLICY "Admins can delete framing export templates files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'framing-export-templates'
  AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::user_role)
);
