

# Ajustement des vues Gantt : projets-only pour panier/portefeuille + scroll vertical

## Probleme

Les sheets Gantt du panier (`ProjectGanttSheet`) et du portefeuille (`PortfolioGanttSheet`) chargent et affichent les tâches des projets alors qu'ils ne devraient montrer que les barres de projets. De plus, le conteneur ne gere pas correctement le scroll vertical pour les longues listes.

## Plan

### 1. Simplifier les requetes Supabase (2 fichiers)

Dans `ProjectGanttSheet.tsx` et `PortfolioGanttSheet.tsx` :
- Supprimer la jointure `tasks (...)` du `select` — on ne charge que les colonnes du projet
- Supprimer le bloc qui itere sur `project.tasks` pour les ajouter au tableau plat
- Ne garder que les entrees de type `project` dans `allTasks`

### 2. Scroll vertical dans les sheets (2 fichiers)

Dans les deux sheets :
- S'assurer que le `SheetContent` utilise `flex flex-col` et que le conteneur du Gantt a `flex-1 overflow-y-auto min-h-0`
- Corriger le typo CSS dans `ProjectGanttSheet` (`w-fullflex` → `w-full flex`)

### 3. Aucune modification sur TaskGantt

Le composant `TaskGantt.tsx` reste inchange — il continue d'afficher taches et sous-taches pour la vue projet.

### Fichiers impactes

| Fichier | Modification |
|---|---|
| `src/components/cart/ProjectGanttSheet.tsx` | Retirer jointure tasks, retirer ajout des taches, corriger classes CSS |
| `src/components/portfolio/PortfolioGanttSheet.tsx` | Retirer jointure tasks, retirer ajout des taches, ajouter flex/scroll |

