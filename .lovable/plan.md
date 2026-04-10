

# Retirer "Terminé" de la liste de choix du filtre de statut

## Modification

Un seul fichier impacté : `src/components/project/LifecycleStatusFilter.tsx`.

Filtrer l'entrée `completed` lors de l'itération sur `lifecycleStatusLabels` :

```tsx
{Object.entries(lifecycleStatusLabels)
  .filter(([value]) => value !== 'completed')
  .map(([value, label]) => (
    <SelectItem key={value} value={value}>
      {label}
    </SelectItem>
  ))}
```

Le type `ProjectLifecycleStatus`, l'objet `lifecycleStatusLabels` et tous les autres usages (exports, badges, formulaires de création) restent inchangés.

