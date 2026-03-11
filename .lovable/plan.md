

# Plan : Boutons visuels pour le statut du cycle de vie projet

## Objectif

Remplacer le `Select` dropdown du statut projet dans `BasicProjectFields.tsx` par un composant de type `ToggleGroup` similaire à `TaskStatusButtons`, avec une icône et une couleur par statut.

## Composant à créer

**`src/components/project/LifecycleStatusButtons.tsx`**

Un groupe de boutons toggle reprenant le pattern de `TaskStatusButtons` :

| Statut | Label | Icône | Couleur |
|--------|-------|-------|---------|
| `study` | À l'étude | `Search` | Gris |
| `validated` | Validé | `CheckCircle` | Bleu |
| `in_progress` | En cours | `Play` | Vert |
| `suspended` | Suspendu | `Pause` | Orange |
| `abandoned` | Abandonné | `XCircle` | Rouge |

> `completed` reste exclu (processus de clôture obligatoire).

Le composant utilise `ToggleGroup` + `ToggleGroupItem` avec des classes conditionnelles colorées par statut (même pattern que `TaskStatusButtons`). Comme il y a 5 statuts, les boutons utiliseront `flex-wrap` pour s'adapter aux petits écrans.

## Modification existante

**`src/components/form/BasicProjectFields.tsx`** : Remplacer le bloc `Select` (lignes 108-126) par le nouveau composant `<LifecycleStatusButtons>`, en passant `lifecycleStatus` et `setLifecycleStatus`.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/project/LifecycleStatusButtons.tsx` | **Nouveau** |
| `src/components/form/BasicProjectFields.tsx` | Remplacement du Select par le nouveau composant |

