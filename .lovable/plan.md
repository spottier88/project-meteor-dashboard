

# Masquer par défaut les projets terminés — Plan d'implémentation

## Objectif

Ajouter un toggle "Afficher les projets terminés" dans la zone de filtres. Par défaut désactivé, les projets au statut `completed` sont masqués. L'utilisateur peut les réafficher en activant le toggle.

## Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/pages/Index.tsx` | Nouvel état `showCompletedProjects` (défaut `false`), persisté en localStorage. Ajout du filtre dans le `useMemo` de `filteredProjects`. Passage de la prop à `ProjectFilters`. |
| `src/components/project/ProjectFilters.tsx` | Nouvelle prop `showCompletedProjects` + `onShowCompletedToggle`. Affichage d'un toggle Switch dans la zone de filtres (à côté de "Mes projets"). Badge "Projets terminés masqués" quand le toggle est désactivé. Prise en compte dans `handleResetFilters` (remet à `false`) et dans le compteur `activeFiltersCount`. |

## Détail technique

### 1. `Index.tsx` — État et filtrage

```ts
// Nouvel état, défaut false
const [showCompletedProjects, setShowCompletedProjects] = useState(() => {
  return localStorage.getItem("showCompletedProjects") === "true";
});

// Persistance localStorage
useEffect(() => {
  localStorage.setItem("showCompletedProjects", showCompletedProjects.toString());
}, [showCompletedProjects]);

// Dans le useMemo filteredProjects, ajouter en premier :
if (!showCompletedProjects && project.lifecycle_status === 'completed') {
  return false;
}
```

### 2. `ProjectFilters.tsx` — Toggle UI

Ajout d'un Switch avec label "Afficher les projets terminés" dans la grille de filtres, à côté du toggle "Mes projets". Le badge dans la barre affichera "Terminés masqués" quand le filtre est actif (toggle désactivé). La réinitialisation remet le toggle à `false`.

## Ce qui ne change pas

- Le filtre `LifecycleStatusFilter` existant (par statut spécifique) reste intact et indépendant
- Les portefeuilles, le dashboard, le panier, et toutes les autres vues ne sont pas impactés
- La logique de permissions (`useVisibleProjects`) n'est pas modifiée

