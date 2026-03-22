

# Correction de la récursion mutuelle entre `project_portfolios` et `portfolio_managers`

## Diagnostic

Le problème est une **récursion mutuelle entre deux tables** :

1. La politique SELECT sur `project_portfolios` (`portfolio_select_direct`) fait :
   ```
   EXISTS (SELECT 1 FROM portfolio_managers WHERE portfolio_id = project_portfolios.id ...)
   ```

2. La politique SELECT sur `portfolio_managers` (`Simple portfolio managers select policy`) fait :
   ```
   portfolio_id IN (SELECT id FROM project_portfolios WHERE created_by = auth.uid())
   ```

Quand on lit `project_portfolios`, PostgreSQL évalue la politique qui lit `portfolio_managers`, dont la politique lit `project_portfolios` → **récursion infinie** (erreur 42P17, masquée par un message vide côté client).

## Correction

Remplacer la politique SELECT de `portfolio_managers` pour **casser la boucle** en supprimant la référence à `project_portfolios` :

```sql
DROP POLICY IF EXISTS "Simple portfolio managers select policy" ON portfolio_managers;

CREATE POLICY "portfolio_managers_select" ON portfolio_managers
  FOR SELECT TO authenticated
  USING (
    -- Admin voit tout
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR
    -- L'utilisateur voit ses propres lignes
    user_id = auth.uid()
  );
```

La clause `portfolio_id IN (SELECT id FROM project_portfolios WHERE created_by = auth.uid())` qui causait la récursion est remplacée par `user_id = auth.uid()`, ce qui couvre le même besoin (un utilisateur voit ses propres assignations de portefeuille) sans requêter `project_portfolios`.

## Fichier impacté

Migration SQL uniquement. Aucune modification frontend.

## Vérification
- La page `/portfolios` se charge pour tous les rôles (admin, portfolio_manager, etc.)
- Le dashboard ne logue plus d'erreur "Erreur récupération portefeuilles"

