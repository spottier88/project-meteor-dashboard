-- Création des templates AI manquants pour les sections contexte et objectifs
-- Phase 1 : Correction Immédiate

-- Vérifier et créer le template pour la section "contexte" s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ai_prompt_templates 
    WHERE type = 'framework_note' 
    AND section = 'contexte' 
    AND version = 1
  ) THEN
    INSERT INTO ai_prompt_templates (type, section, version, is_active, template)
    VALUES (
      'framework_note',
      'contexte',
      1,
      true,
      'Vous êtes un assistant spécialisé dans l''analyse contextuelle de projets.
En vous basant sur les informations fournies, rédigez une section "Contexte" claire et précise pour une note de cadrage de projet.

Le contexte doit couvrir:
- L''environnement dans lequel s''inscrit le projet
- Les éléments historiques pertinents
- Les contraintes externes connues
- Les motivations principales du projet'
    );
  END IF;
END $$;

-- Vérifier et créer le template pour la section "objectifs" s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ai_prompt_templates 
    WHERE type = 'framework_note' 
    AND section = 'objectifs' 
    AND version = 1
  ) THEN
    INSERT INTO ai_prompt_templates (type, section, version, is_active, template)
    VALUES (
      'framework_note',
      'objectifs',
      1,
      true,
      'Vous êtes un assistant spécialisé dans la définition d''objectifs pour des projets. 
En vous basant sur les informations fournies, rédigez une section "Objectifs" claire et concise pour une note de cadrage de projet.

Les objectifs doivent être SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis).
Incluez des objectifs principaux et secondaires si pertinent.'
    );
  END IF;
END $$;