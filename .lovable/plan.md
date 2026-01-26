
# Plan de correction : Formulaire de recherche de gestionnaires de portefeuille

## Problèmes identifiés

### Problème 1 : Requête Supabase avec jointure imbriquée
La requête actuelle utilise une jointure imbriquée qui peut ne pas fonctionner correctement :
```typescript
.select(`
  user_id,
  profiles!user_roles_user_id_fkey(id, email, first_name, last_name)
`)
```
Cette syntaxe dépend d'une relation étrangère explicitement nommée dans Supabase. Si la relation n'est pas configurée, les données `profiles` seront `null`.

### Problème 2 : Filtrage cmdk avec valeurs null
Le composant `CommandItem` reçoit une `value` construite ainsi :
```typescript
value={`${formatUserName(user)} ${user.email}`}
```
Si `user.email` est `null` ou `undefined`, cela produit une chaîne contenant "undefined" ou "null", ce qui perturbe le filtrage.

---

## Solution proposée

Refactoriser la requête pour utiliser le même pattern éprouvé que dans `usePortfolioManagers.ts` : deux requêtes séparées au lieu d'une jointure imbriquée.

### Fichier à modifier : `src/components/portfolio/AddPortfolioManagerForm.tsx`

#### Modifications de la query (lignes 46-84)

```typescript
const { data: eligibleUsers, isLoading: loadingUsers } = useQuery({
  queryKey: ["eligible-portfolio-managers", portfolioId],
  queryFn: async () => {
    // Étape 1 : Récupérer les user_id avec le rôle portfolio_manager
    const { data: usersWithRole, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "portfolio_manager");

    if (roleError) throw roleError;
    if (!usersWithRole || usersWithRole.length === 0) return [];

    // Étape 2 : Récupérer les gestionnaires déjà assignés au portefeuille
    const { data: existingManagers, error: managersError } = await supabase
      .from("portfolio_managers")
      .select("user_id")
      .eq("portfolio_id", portfolioId);

    if (managersError) throw managersError;

    const existingManagerIds = existingManagers?.map(m => m.user_id) || [];
    
    // Filtrer les utilisateurs déjà assignés
    const availableUserIds = usersWithRole
      .map(ur => ur.user_id)
      .filter(userId => !existingManagerIds.includes(userId));

    if (availableUserIds.length === 0) return [];

    // Étape 3 : Récupérer les profils des utilisateurs disponibles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", availableUserIds);

    if (profilesError) throw profilesError;

    return profiles || [];
  },
  enabled: isOpen,
});
```

#### Correction de la valeur de filtrage (ligne 156)

Sécuriser la construction de la valeur de recherche pour éviter les `null`/`undefined` :

```typescript
<CommandItem
  key={user.id}
  value={`${formatUserName(user)} ${user.email || ''}`.toLowerCase()}
  onSelect={() => {
    setSelectedUserId(user.id);
    setOpen(false);
  }}
>
```

---

## Résumé des changements

| Élément | Avant | Après |
|---------|-------|-------|
| Requête Supabase | Jointure imbriquée (1 requête) | 3 requêtes séparées (pattern éprouvé) |
| Valeur de filtrage | `${name} ${email}` avec possibles nulls | `${name} ${email || ''}.toLowerCase()` |
| Type de retour | `UserProfile[]` via `.profiles` | `UserProfile[]` direct depuis `profiles` |

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/portfolio/AddPortfolioManagerForm.tsx` | Refactoriser la query + corriger la valeur de filtrage |

---

## Avantages de cette approche

1. **Fiabilité** : Le pattern à requêtes séparées est utilisé ailleurs dans l'application et fonctionne
2. **Clarté** : Le flux de données est plus explicite et facile à déboguer
3. **Robustesse** : Gestion des cas limites (liste vide, valeurs null)
