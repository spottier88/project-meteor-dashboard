

# Migration de @supabase/auth-ui-react — Suppression de code mort

## Analyse

Le fichier `src/pages/Login.tsx` importe `Auth` et `ThemeSupa` aux lignes 1-2, mais **ces imports ne sont jamais utilisés dans le JSX**. La page utilise déjà des formulaires custom pour la connexion (magic link, email/mot de passe, inscription, réinitialisation).

Il n'y a donc **aucune migration fonctionnelle à réaliser** — seulement du nettoyage.

## Modifications

### 1. `src/pages/Login.tsx`
Supprimer les 2 lignes d'import inutilisées :
```typescript
// Supprimer :
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
```

### 2. `package.json`
Supprimer les 2 dépendances :
- `@supabase/auth-ui-react`
- `@supabase/auth-ui-shared`

## Impact

Aucun impact fonctionnel. Les formulaires d'authentification sont déjà entièrement custom. Cette migration se résume à supprimer des imports morts et désinstaller 2 packages inutilisés.

