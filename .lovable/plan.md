

# Correction de la recursion infinie RLS sur `portfolio_managers`

## Cause racine

La politique INSERT sur `portfolio_managers` contient un sous-select sur `project_portfolios`. Or la politique SELECT de `project_portfolios` (`portfolio_select_direct`) contient elle-meme un sous-select sur `portfolio_managers`. PostgreSQL detecte cette boucle et leve l'erreur 42P17.

```text
INSERT portfolio_managers
  └─ with_check → SELECT project_portfolios
       └─ RLS SELECT → SELECT portfolio_managers
            └─ RLS SELECT → deja en cours → RECURSION
```

## Correction

Creer une fonction SECURITY DEFINER qui verifie si l'utilisateur peut inserer dans `portfolio_managers` sans passer par les politiques RLS, puis remplacer la politique INSERT actuelle.

### 1. Nouvelle fonction SECURITY DEFINER

```sql
CREATE OR REPLACE FUNCTION public.can_insert_portfolio_manager(
  p_user_id uuid,
  p_portfolio_id uuid,
  p_target_user_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Admin peut tout faire
    IF EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = p_user_id AND role = 'admin'
    ) THEN RETURN true; END IF;

    -- Createur du portefeuille
    IF EXISTS (
        SELECT 1 FROM project_portfolios
        WHERE id = p_portfolio_id AND created_by = p_user_id
    ) THEN RETURN true; END IF;

    -- Insertion automatique du owner (trigger auto_add_portfolio_owner)
    IF p_role = 'owner' AND EXISTS (
        SELECT 1 FROM project_portfolios
        WHERE id = p_portfolio_id AND created_by = p_target_user_id
    ) THEN RETURN true; END IF;

    RETURN false;
END;
$$;
```

### 2. Remplacer la politique INSERT

```sql
DROP POLICY "Simple portfolio managers insert policy" ON portfolio_managers;

CREATE POLICY "portfolio_managers_insert"
ON portfolio_managers FOR INSERT TO authenticated
WITH CHECK (
    can_insert_portfolio_manager(auth.uid(), portfolio_id, user_id, role)
);
```

### 3. Securiser aussi la politique SELECT de `project_portfolios`

La politique SELECT de `project_portfolios` (`portfolio_select_direct`) utilise un sous-select direct sur `portfolio_managers`. Il faut la remplacer par un appel a `can_view_portfolio` (qui est deja SECURITY DEFINER et existe) :

```sql
DROP POLICY "portfolio_select_direct" ON project_portfolios;

CREATE POLICY "portfolio_select_via_function"
ON project_portfolios FOR SELECT TO authenticated
USING (can_view_portfolio(auth.uid(), id));
```

Cela coupe la chaine de recursion a la source : plus aucune politique RLS ne fera de sous-select direct sur une table dont les politiques referencent la table d'origine.

### Fichiers impactes

Aucun fichier applicatif a modifier — le correctif est purement SQL (1 migration).

### Risque

Faible. Les fonctions SECURITY DEFINER `can_view_portfolio` et `can_manage_portfolio_simple` existent deja et implementent la meme logique que les politiques actuelles.

