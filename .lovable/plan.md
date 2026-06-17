## Objectif

Proposer périodiquement à l'utilisateur d'évaluer l'application (façon "rate this app" mobile), tant qu'il ne l'a pas fait, avec :
- une **fréquence paramétrable** par l'administrateur (réglage global),
- un bouton **"Ne plus me demander maintenant"** (report) en plus du bouton **"Plus jamais"** (opt-out définitif),
- le respect de l'évaluation existante : si l'utilisateur a déjà noté via `app_ratings`, plus aucune relance.

S'appuie sur l'existant : `AppRatingDialog`, hook `useAppRating` (table `app_ratings`), `useUserPreferences`, `application_settings` (réglage admin global), et le pattern déjà utilisé pour `IncompleteProfileDialog` (rappel différé via `profile_reminder_dismissed_until`).

## Plan d'implémentation

### 1. Base de données

**Migration** — ajouter 2 colonnes à `user_preferences` :
- `rating_prompt_dismissed_until timestamptz` — date jusqu'à laquelle on ne réaffiche pas la modale (report).
- `rating_prompt_opted_out boolean default false` — opt-out définitif ("Ne plus jamais me proposer").

**Insert** dans `application_settings` (type `general` ou `rating`) :
- clé `rating_prompt_frequency_days` (valeur par défaut `30`) — délai entre 2 relances.
- clé `rating_prompt_initial_delay_days` (valeur par défaut `7`) — délai après création du compte avant la 1ʳᵉ relance.

### 2. Hook `useRatingPrompt`

Nouveau hook `src/hooks/useRatingPrompt.ts` qui :
- lit `app_ratings` (via `useAppRating`), `user_preferences` (via `useUserPreferences`) et la config admin (`application_settings`).
- retourne `shouldShowPrompt: boolean` calculé ainsi (tous doivent être vrais) :
  - utilisateur connecté,
  - `hasRated === false`,
  - `rating_prompt_opted_out !== true`,
  - `now() > rating_prompt_dismissed_until` (ou null),
  - `now() > created_at(profile) + initial_delay_days`.
- expose `snooze()` → met `dismissed_until = now + frequency_days`, et `optOut()` → met `opted_out = true`.

### 3. Composant `RatingPromptDialog`

Nouveau `src/components/rating/RatingPromptDialog.tsx` : modale non-bloquante avec
- titre "Donnez-nous votre avis",
- mêmes étoiles + commentaire que `AppRatingDialog` (réutilise `StarRating`),
- 3 boutons : **Envoyer mon avis** (soumet via `useAppRating`), **Plus tard** (`snooze()`), **Ne plus me demander** (`optOut()`).
- Sur succès d'envoi, ferme la modale (plus jamais relancée car `hasRated` devient true).

### 4. Intégration globale

Monter le composant une seule fois dans `src/pages/Index.tsx` (ou un layout commun authentifié). Il s'auto-ouvre quand `shouldShowPrompt === true`. Pas de relance dans la même session après dismiss.

### 5. Administration

Dans la page admin existante (`AppRatingsManagement.tsx` ou un panneau Réglages) : ajouter une carte "Fréquence des relances d'évaluation" avec 2 inputs (délai initial, fréquence en jours) écrivant dans `application_settings`. Si la page admin appropriée n'existe pas pour ces réglages, on les ajoutera à `AppRatingsManagement.tsx`.

### 6. Réglage utilisateur (option)

Dans `UserPreferencesForm.tsx`, ajouter un bouton "Réinitialiser les relances d'évaluation" qui remet `opted_out=false` et `dismissed_until=null` (symétrique à "Revoir le tutoriel").

## Points techniques

- **Réutilisation** : `useAppRating.submitRating` gère déjà l'upsert + invalidation ; pas de changement côté soumission.
- **Pas de boucle de rendu** : `shouldShowPrompt` mémoïsé, ouverture gérée par un `useState` local avec garde `useRef` pour ne déclencher qu'une fois par montage.
- **RLS** : `user_preferences` et `app_ratings` ont déjà leurs politiques ; `application_settings` est lisible par tous les authentifiés (à vérifier sinon ajouter une policy SELECT).
- **Pas de modification** de la table `app_ratings` ni du `AppRatingDialog` existant (toujours accessible via `AppRatingButton` dans le header).

## Hors périmètre

- Notifications email de rappel d'évaluation.
- Statistiques sur le taux d'acceptation/refus des prompts.
