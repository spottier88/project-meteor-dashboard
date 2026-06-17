
ALTER TYPE setting_type ADD VALUE IF NOT EXISTS 'rating';

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS rating_prompt_dismissed_until timestamptz,
  ADD COLUMN IF NOT EXISTS rating_prompt_opted_out boolean NOT NULL DEFAULT false;
