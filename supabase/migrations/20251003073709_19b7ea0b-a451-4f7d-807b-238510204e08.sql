-- Migration pour ajouter les templates IA manquants pour les notes de cadrage
-- Ces templates correspondent aux sections du formulaire de projet (Step 4)

-- Section: parties_prenantes (pour le champ stakeholders)
INSERT INTO ai_prompt_templates (type, section, template, version, is_active)
VALUES (
  'framework_note',
  'parties_prenantes',
  'Vous êtes un assistant spécialisé dans l''identification des parties prenantes de projets.
En vous basant sur les informations fournies, rédigez une section "Parties prenantes" claire et structurée pour une note de cadrage de projet.

Identifiez et décrivez:
- Les parties prenantes internes (équipes, départements, direction)
- Les parties prenantes externes (partenaires, fournisseurs, clients)
- Le rôle et l''implication de chaque partie prenante
- Les relations et interactions entre les parties prenantes
- Les attentes et besoins spécifiques de chaque groupe',
  1,
  true
) ON CONFLICT DO NOTHING;

-- Section: organisation (pour le champ governance)
INSERT INTO ai_prompt_templates (type, section, template, version, is_active)
VALUES (
  'framework_note',
  'organisation',
  'Vous êtes un assistant spécialisé dans la définition de la gouvernance et de l''organisation de projets.
En vous basant sur les informations fournies, rédigez une section "Gouvernance" claire et professionnelle pour une note de cadrage de projet.

Décrivez:
- La structure de gouvernance du projet
- Les instances décisionnelles (comités, groupes de travail)
- Les rôles et responsabilités clés (chef de projet, sponsor, équipe)
- Les processus de décision et d''escalade
- La fréquence et le format des réunions de pilotage
- Les mécanismes de reporting et de communication',
  1,
  true
) ON CONFLICT DO NOTHING;

-- Section: planning (pour le champ timeline)
INSERT INTO ai_prompt_templates (type, section, template, version, is_active)
VALUES (
  'framework_note',
  'planning',
  'Vous êtes un assistant spécialisé dans la planification de projets.
En vous basant sur les informations fournies, rédigez une section "Planning prévisionnel" claire et détaillée pour une note de cadrage de projet.

Précisez:
- Les principales phases du projet
- Les jalons clés et leurs dates prévisionnelles
- Les échéances importantes et dates butoirs
- Les dépendances critiques entre les phases
- Les périodes de validation et de recette
- Les marges de manœuvre et zones de flexibilité',
  1,
  true
) ON CONFLICT DO NOTHING;

-- Section: livrables (pour le champ deliverables)
INSERT INTO ai_prompt_templates (type, section, template, version, is_active)
VALUES (
  'framework_note',
  'livrables',
  'Vous êtes un assistant spécialisé dans la définition des livrables de projets.
En vous basant sur les informations fournies, rédigez une section "Livrables attendus" claire et exhaustive pour une note de cadrage de projet.

Détaillez:
- Les livrables tangibles du projet (documents, systèmes, produits)
- Les livrables intangibles (formations, processus, connaissances)
- Les critères de qualité et d''acceptation pour chaque livrable
- Les responsables de la production de chaque livrable
- Le planning de livraison prévisionnel
- Les modalités de validation et d''approbation',
  1,
  true
) ON CONFLICT DO NOTHING;