-- Table pour stocker les évaluations de l'application par les utilisateurs
CREATE TABLE public.app_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- Un utilisateur = une évaluation (modifiable)
);

-- Créer un trigger de validation pour la note (1-5) au lieu d'un CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_app_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'La note doit être comprise entre 1 et 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_app_rating_trigger
BEFORE INSERT OR UPDATE ON public.app_ratings
FOR EACH ROW
EXECUTE FUNCTION public.validate_app_rating();

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_app_ratings_updated_at
BEFORE UPDATE ON public.app_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.app_ratings ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent insérer leur propre évaluation
CREATE POLICY "Users can insert their own rating"
ON public.app_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent voir leur propre évaluation
CREATE POLICY "Users can view their own rating"
ON public.app_ratings
FOR SELECT
USING (auth.uid() = user_id);

-- Politique : les utilisateurs peuvent modifier leur propre évaluation
CREATE POLICY "Users can update their own rating"
ON public.app_ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique : les admins peuvent voir toutes les évaluations
CREATE POLICY "Admins can view all ratings"
ON public.app_ratings
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);