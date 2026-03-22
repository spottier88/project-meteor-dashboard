

# Correction de la récursion infinie sur `project_portfolios`

## Diagnostic

L'erreur réseau est : `42P17 - infinite recursion detected in policy for relation "project_portfolios"`.

**Cause** : La migration précédente a tenté de supprimer les politiques SELECT `"Users can view portfolios they have access to"` et `"portfolio_select_policy"`, mais la politique existante en base s'appelle en réalité `"Simple portfolio select policy"`. Elle n'a donc **jamais été supprimée**.

Résultat : deux politiques SELECT coexistent :
1. `Simple portfolio select policy` → appelle `can_view_portfolio()` qui fait un `SELECT` sur `project_portfolios` → **récursion infinie**
2. `portfolio_select_direct` → politique directe (ajoutée par la migration)

Même si `can_view_portfolio` est `SECURITY DEFINER`, PostgreSQL évalue toutes les politiques permissives et détecte la récursion dans la politique n°1.

## Correction

**Migration SQL unique** : supprimer la politique `"Simple portfolio select policy"` qui n'a plus lieu d'être, car `portfolio_select_direct` la remplace avec une expression directe sans récursion.

```sql
DROP POLICY IF EXISTS "Simple portfolio select policy" ON project_portfolios;
```

Aucune modification frontend.

## Vérification post-correction
- La politique `portfolio_select_direct` reste en place et couvre tous les cas : admin, créateur, membre de `portfolio_managers`.
- Les pages `/portfolios` et le dashboard ne devraient plus retourner d'erreur 500.

