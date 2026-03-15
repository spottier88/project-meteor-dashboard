

# Ajout d'un bouton "Historique des revues" dans le bloc LastReview

## Contexte
Le composant `LastReview.tsx` affiche la dernière revue dans la page de synthèse projet mais ne propose aucun lien vers l'historique complet. L'historique existe déjà via la route `/projects/:projectId/reviews` (composant `ReviewHistory.tsx`).

## Modification

**Fichier unique** : `src/components/LastReview.tsx`

1. Ajouter une prop `projectId: string` à l'interface `LastReviewProps`.
2. Dans le `CardTitle`, à côté de la date, ajouter un bouton icône `History` (lucide-react) qui navigue vers `/projects/${projectId}/reviews` via `useNavigate`.
3. Le bouton est affiché que la revue existe ou non (permet d'accéder à l'historique même sans revue courante).

**Fichier appelant** : `src/components/project/ProjectSummaryContent.tsx`
- Passer `projectId={project.id}` au composant `<LastReview />`.

## Rendu visuel
- Icône `History` discrète (style ghost, taille h-8 w-8) placée dans le header de la carte, entre le titre "Dernière revue" et la date.
- Tooltip : "Historique des revues".

