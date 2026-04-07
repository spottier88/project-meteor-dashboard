

# Correctif — Erreur 400 sur la requête `portfolio_projects` avec jointure `portfolio_managers`

## Diagnostic

**Cause** : Dans `usePortfolioProjectAccess.ts` (ligne 28-42), la requête Supabase tente une jointure `!inner` entre `portfolio_projects` et `portfolio_managers`. Or ces deux tables n'ont pas de relation directe (pas de FK entre elles) — elles sont reliées indirectement via `project_portfolios.id`. PostgREST ne peut pas résoudre cette jointure et retourne une erreur 400.

**Pourquoi cet appel existe** : Ce hook détermine si un utilisateur peut voir un projet en lecture seule via un portefeuille. Il est utilisé par `useProjectPermissions`, `useTaskPermissions`, `useRiskAccess` et `useReviewAccess` — donc essentiel au système de permissions. L'erreur 400 fait que la première requête échoue silencieusement, mais le fallback (2e requête, lignes 54-65, qui vérifie `created_by`) rattrape partiellement le cas du propriétaire. Les gestionnaires et lecteurs de portefeuille ne sont donc **pas détectés** actuellement.

**Impact réel** : Les utilisateurs ajoutés comme `manager` ou `viewer` dans un portefeuille ne bénéficient probablement pas de leur accès lecture seule aux projets du portefeuille.

## Correction

### Fichier unique : `src/hooks/usePortfolioProjectAccess.ts`

Remplacer la requête invalide par deux requêtes séquentielles valides :

1. Récupérer les `portfolio_id` des portefeuilles contenant le projet (depuis `portfolio_projects`)
2. Chercher dans `portfolio_managers` si l'utilisateur est membre d'un de ces portefeuilles
3. Récupérer le nom du portefeuille depuis `project_portfolios`

```ts
// Étape 1 : portefeuilles contenant ce projet
const { data: links } = await supabase
  .from("portfolio_projects")
  .select("portfolio_id")
  .eq("project_id", projectId);

if (!links || links.length === 0) return null;

const portfolioIds = links.map(l => l.portfolio_id);

// Étape 2 : l'utilisateur est-il gestionnaire/viewer d'un de ces portefeuilles ?
const { data: membership } = await supabase
  .from("portfolio_managers")
  .select("portfolio_id, role")
  .eq("user_id", userProfile.id)
  .in("portfolio_id", portfolioIds)
  .limit(1)
  .maybeSingle();

// Étape 3 : vérifier aussi si l'utilisateur est le créateur
const { data: ownedPortfolio } = await supabase
  .from("project_portfolios")
  .select("id, name")
  .in("id", portfolioIds)
  .eq("created_by", userProfile.id)
  .limit(1)
  .maybeSingle();

// Résolution : priorité au rôle explicite, sinon owner
if (membership) {
  // Récupérer le nom du portefeuille
  const { data: pf } = await supabase
    .from("project_portfolios")
    .select("name")
    .eq("id", membership.portfolio_id)
    .single();
  return { portfolioId: membership.portfolio_id, portfolioName: pf?.name || "", role: membership.role };
}
if (ownedPortfolio) {
  return { portfolioId: ownedPortfolio.id, portfolioName: ownedPortfolio.name, role: 'owner' };
}
return null;
```

## Impact

| Fichier | Modification |
|---|---|
| `src/hooks/usePortfolioProjectAccess.ts` | Remplacement de la jointure invalide par des requêtes séparées valides |

- Supprime l'erreur 400 en console
- Rétablit la détection correcte des gestionnaires et lecteurs de portefeuille
- Aucune régression : le hook est consommé en lecture seule par les hooks de permissions existants

