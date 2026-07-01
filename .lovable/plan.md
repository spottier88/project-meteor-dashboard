# Analyse

## Fonctionnement actuel
`useRatingPrompt` déclenche la modale si :
1. `hasRated === false` (aucune ligne dans `app_ratings`)
2. `rating_prompt_opted_out !== true`
3. `rating_prompt_dismissed_until` absent ou dépassé
4. `now >= user.created_at + initial_delay_days`

La modale `RatingPromptDialog` n'est montée que dans **`src/pages/Index.tsx`** (route `/`).

## Causes probables pour les utilisateurs pré-existants

1. **Route de landing** : après login, beaucoup d'utilisateurs anciens ont une URL sauvegardée (`redirectionUtils`) qui les envoie sur `/projects`, `/dashboard`, `/my-tasks`… La modale n'est jamais montée → jamais affichée. C'est la cause la plus probable.
2. **Ambiguïté de la date de référence** : la règle « attendre `initial_delay_days` après création du compte » n'a plus de sens pour un compte créé il y a 12 mois — le délai initial existait pour laisser à un **nouvel** utilisateur le temps de tester l'app. Pour un compte pré-existant, le vrai point de départ devrait être la **date de mise en service de la fonctionnalité** (ou la première connexion post-déploiement).
3. **Absence de traçabilité** : aucun log ne permet aujourd'hui de savoir pourquoi le hook renvoie `false`.

# Plan de correction

## 1. Monter la modale au niveau global (root layout)
Déplacer `<RatingPromptDialog />` de `src/pages/Index.tsx` vers `src/App.tsx` (à l'intérieur du `PermissionsProvider`, en dehors du `<Routes>` ou dans un layout parent), afin qu'elle puisse s'afficher quelle que soit la page de destination après login. La modale reste inactive tant que `useUser()` renvoie `null` (garde déjà en place).

## 2. Introduire un point de départ commun « feature launch »
Ajouter un réglage global dans `application_settings` :
- clé `rating_prompt_feature_launched_at` (type `rating`, valeur ISO date, à initialiser à la date du jour)

Dans `useRatingPrompt`, remplacer la référence de délai initial par :
```
referenceDate = max(user.created_at, feature_launched_at)
eligibleAt    = referenceDate + initial_delay_days
```
Comportement :
- **Nouvel utilisateur** (créé après le lancement) : inchangé (attend `initial_delay_days` après création).
- **Utilisateur pré-existant** : attend `initial_delay_days` après la date de lancement, puis la relance apparaît (respect du délai initial pour éviter un pic brutal de sollicitations le jour du déploiement).

Exposer le champ dans `RatingPromptSettingsCard` (input date) pour que l'admin puisse ajuster/réinitialiser cette date.

## 3. Diagnostic non intrusif
Ajouter dans `useRatingPrompt` un `logger.debug` conditionnel (via `import.meta.env.DEV`) listant les raisons pour lesquelles la modale n'est pas affichée (`hasRated`, `optedOut`, `dismissedUntil`, `waitingInitialDelay`), afin de faciliter les vérifications futures sans polluer la console en production.

## 4. Non-régression
- Aucune modification des tables `app_ratings` ni des flux d'envoi d'avis.
- Les préférences utilisateurs existantes (`rating_prompt_opted_out`, `rating_prompt_dismissed_until`) restent prioritaires : un utilisateur ayant snoozé ou opt-out n'est pas re-sollicité.
- Le bouton « Réactiver les relances » dans `UserPreferencesForm` continue de fonctionner (reset des deux champs).
- Aucune migration destructive : uniquement un `INSERT` idempotent dans `application_settings`.

## Détails techniques
- **Migration** : `INSERT INTO application_settings (key, value, type) VALUES ('rating_prompt_feature_launched_at', <today>, 'rating') ON CONFLICT (key) DO NOTHING;`
- **Hook** : lire la 3ᵉ clé dans le même `useQuery` existant, parser en ms, calculer `referenceDate = Math.max(accountCreatedMs, featureLaunchedMs)`.
- **UI admin** : ajouter un champ « Date de mise en service de la relance » dans `RatingPromptSettingsCard` avec bouton « Réinitialiser à aujourd'hui » (utile si un admin veut « repartir de zéro » après une évolution majeure de l'app).
- **App.tsx** : monter `<RatingPromptDialog />` juste après `<Toaster />`, protégé par `useUser()` implicitement via le hook.

## Fichiers impactés
- `supabase/migrations/*` (via l'outil migration) — 1 INSERT idempotent
- `src/hooks/useRatingPrompt.ts` — lecture 3ᵉ clé, calcul `referenceDate`, logs DEV
- `src/components/rating/RatingPromptSettingsCard.tsx` — champ date + save
- `src/App.tsx` — montage global de `<RatingPromptDialog />`
- `src/pages/Index.tsx` — retirer le montage local (évite double montage)
