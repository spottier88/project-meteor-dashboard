

# Refonte de la page Administration — Regroupement par catégories

## Problème actuel

13 boutons affichés dans une grille plate sans distinction. L'administrateur doit scanner visuellement tous les éléments pour trouver la fonction recherchée.

## Proposition

Regrouper les boutons en **5 sections thématiques**, chacune avec un titre et une description courte, séparées visuellement par des `Card` shadcn. La grille de boutons est conservée à l'intérieur de chaque section.

### Catégories proposées

```text
┌─ Droits & Organisation ─────────────────────┐
│  Gestion des utilisateurs                    │
│  Gestion de l'organisation                   │
│  Évaluations                                 │
└──────────────────────────────────────────────┘

┌─ Paramétrage ────────────────────────────────┐
│  Paramètres généraux                         │
│  Types d'activités                           │
│  Points d'activités                          │
│  Tokens API                                  │
└──────────────────────────────────────────────┘

┌─ Modèles & Exports ─────────────────────────┐
│  Modèles de projet                           │
│  Modèles d'email                             │
│  Modèles d'export cadrage                    │
└──────────────────────────────────────────────┘

┌─ Intelligence Artificielle ──────────────────┐
│  Templates IA                                │
│  Monitoring IA                               │
└──────────────────────────────────────────────┘

┌─ Communication ──────────────────────────────┐
│  Gestion des notifications                   │
└──────────────────────────────────────────────┘
```

## Implémentation

### Fichier unique impacté : `src/pages/AdminDashboard.tsx`

1. Définir un tableau de catégories, chacune avec `title`, `description`, `icon` et `items[]`
2. Remplacer la grille plate par un `map` sur les catégories, chaque catégorie rendue dans un composant `Card` (CardHeader + CardContent)
3. À l'intérieur de chaque Card, conserver la grille de boutons existante (md:grid-cols-2 lg:grid-cols-3)
4. Ajouter une légère couleur d'accent sur l'icône de la catégorie pour la différencier des boutons

Aucun nouveau composant, aucune nouvelle dépendance. Changement purement visuel dans un seul fichier.

