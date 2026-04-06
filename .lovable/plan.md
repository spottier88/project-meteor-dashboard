

# Correctif — Erreur lors de la suppression d'une revue de projet

## Diagnostic

L'erreur Supabase est : **`function uuid_nil() does not exist`**.

La chaîne d'exécution est la suivante :

```text
DELETE review_actions (OK)
  → DELETE reviews
    → TRIGGER trg_sync_project_after_review_delete
      → UPDATE projects SET status=..., progress=..., last_review_date=...
        → TRIGGER sync_portfolio_stats_trigger
          → FUNCTION sync_portfolio_stats()
            → appelle uuid_nil()  ← ERREUR ICI
```

La fonction `sync_portfolio_stats` contient cette ligne :

```sql
IF TG_OP = 'UPDATE' AND OLD.portfolio_id IS NOT NULL
   AND OLD.portfolio_id != COALESCE(NEW.portfolio_id, uuid_nil()) THEN
```

`uuid_nil()` est une fonction de l'extension `uuid-ossp` qui n'est pas activée (ou pas accessible dans ce schéma). L'erreur se produit à chaque suppression de revue car le trigger de synchronisation projet déclenche à son tour le trigger portfolio sur la table `projects`.

## Correction

### Migration SQL unique

Remplacer l'appel à `uuid_nil()` par la valeur littérale équivalente `'00000000-0000-0000-0000-000000000000'::uuid` dans la fonction `sync_portfolio_stats` :

```sql
CREATE OR REPLACE FUNCTION sync_portfolio_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.portfolio_id IS NOT NULL THEN
        PERFORM update_portfolio_stats(NEW.portfolio_id);
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.portfolio_id IS NOT NULL
       AND OLD.portfolio_id != COALESCE(NEW.portfolio_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        PERFORM update_portfolio_stats(OLD.portfolio_id);
    END IF;

    IF TG_OP = 'DELETE' AND OLD.portfolio_id IS NOT NULL THEN
        PERFORM update_portfolio_stats(OLD.portfolio_id);
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Impact

| Élément | Détail |
|---|---|
| Fichier modifié | Aucun fichier source — migration SQL uniquement |
| Fonction corrigée | `sync_portfolio_stats()` |
| Risque | Nul — remplacement d'un appel de fonction manquante par sa valeur littérale équivalente |

Aucune modification du code frontend n'est nécessaire. Le composant `DeleteReviewDialog` fonctionne correctement ; c'est le trigger SQL en cascade qui échouait.

