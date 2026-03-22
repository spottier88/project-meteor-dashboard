
Analyse révisée

J’ai repris la chaîne complète UI + SQL + état réel de la base, et le diagnostic précédent doit être corrigé.

Constats vérifiés
- L’utilisateur `c13fbfbd-d371-440d-9d40-7b1e8d75bf25` possède bien le rôle `portfolio_manager` dans `user_roles`.
- Côté front, le bouton est affiché via `usePortfolioPermissions`, donc la permission UI est cohérente.
- La politique RLS `INSERT` actuelle sur `project_portfolios` autorise bien la création pour `admin` et `portfolio_manager` avec `created_by = auth.uid()`.
- En base réelle, la politique `SELECT` de `project_portfolios` est aujourd’hui : `USING (can_view_portfolio(auth.uid(), id))`.
- En base réelle, le trigger d’auto-ajout du créateur dans `portfolio_managers` n’existe plus. Sur `project_portfolios`, seul le trigger `portfolio_updated_at_trigger` est présent.
- Il existe pourtant un ancien portefeuille créé par cet utilisateur (`ae8f38f3-...`) avec une ligne `owner` dans `portfolio_managers`, ce qui montre que le mécanisme a déjà fonctionné puis a régressé.

Conclusion probable
Le problème n’est pas le droit métier de création, mais la combinaison de 2 fragilités SQL :
1. La création front fait un `.insert(...).select().single()` alors que le résultat retourné n’est pas utilisé.
2. La politique `SELECT` repose sur `can_view_portfolio(...)`, qui reconsulte `project_portfolios` au lieu d’évaluer directement la ligne courante. Lors d’un `INSERT ... RETURNING`, cette approche est fragile.
3. Le trigger d’auto-inscription du créateur comme `owner` dans `portfolio_managers` a disparu de la base réelle, donc aucun filet de sécurité ne compense ce point.

Pourquoi le plan précédent était incomplet
- Restaurer seulement l’auto-ajout du créateur ne suffit pas à fiabiliser la création tant que le `SELECT` post-insert reste couplé à une politique fonctionnelle qui re-query la table.
- Il faut corriger à la fois la base et l’appel frontend.

Plan de correction

1. Corriger la politique `SELECT` sur `project_portfolios`
- Remplacer `USING (can_view_portfolio(auth.uid(), id))` par une expression directe :
  - admin
  - ou `created_by = auth.uid()`
  - ou existence d’une ligne dans `portfolio_managers` pour ce portefeuille
- Objectif : éviter toute dépendance à une relecture de `project_portfolios` pendant le `RETURNING`.

2. Restaurer le mécanisme d’owner automatique
- Recréer la fonction `auto_add_portfolio_owner()`
- Recréer le trigger `trigger_auto_add_portfolio_owner` sur `project_portfolios`
- Conserver la contrainte unique `(portfolio_id, user_id)` sur `portfolio_managers`
- Objectif : garantir qu’après création, le créateur dispose aussi de ses droits de gestion explicites.

3. Rendre la création frontend robuste
- Fichier : `src/hooks/usePortfolios.ts`
- Remplacer la création actuelle :
  - aujourd’hui : `.insert(...).select().single()`
  - cible : `.insert(...)` simple, sans readback immédiat
- Le résultat n’étant pas exploité, on garde seulement :
  - invalidation React Query
  - toast succès
- Option complémentaire : si besoin d’un retour objet plus tard, faire un second `select` séparé après succès.

4. Améliorer le diagnostic d’erreur
- Toujours dans `src/hooks/usePortfolios.ts`
- Logger `error.code`, `error.message`, `error.details`, `error.hint`
- Éviter de mapper trop tôt toute erreur `42501` en message générique sans conserver la cause technique dans la console.
- Objectif : simplifier les futurs diagnostics RLS.

5. Vérifications de non-régression
- Cas 1 : un `portfolio_manager` non admin peut créer un portefeuille
- Cas 2 : le portefeuille apparaît immédiatement dans la liste
- Cas 3 : une ligne `owner` est créée dans `portfolio_managers`
- Cas 4 : le créateur peut ensuite modifier/supprimer son portefeuille
- Cas 5 : un utilisateur sans rôle `portfolio_manager` ni `admin` ne peut pas créer
- Cas 6 : un admin continue de pouvoir créer sans régression

Portée de modification
- Base SQL :
  - politique `SELECT` de `project_portfolios`
  - fonction `auto_add_portfolio_owner()`
  - trigger `trigger_auto_add_portfolio_owner`
- Front :
  - `src/hooks/usePortfolios.ts`

Résolution recommandée
- Correction en 2 couches obligatoire :
  1. sécuriser la base réelle (policy directe + trigger owner)
  2. découpler le front du `SELECT` post-insert inutile
- C’est la combinaison la plus robuste pour supprimer définitivement ce bug.
