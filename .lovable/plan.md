

# Filtrer les tâches terminées dans la section de revue

## Fichier modifié unique : `src/components/review/TaskStatusUpdateSection.tsx`

### Modifications

1. **Ajouter un état `showDone`** (booléen, `false` par défaut).

2. **Filtrer l'affichage** : la liste rendue ne montre que les tâches dont `currentStatus !== "done"`, sauf si `showDone` est activé. Important : les tâches terminées restent dans `taskStatusUpdates` (transmises au parent) pour ne pas casser la logique de soumission.

3. **Ajouter un toggle Switch** dans le `CardHeader`, à côté du badge "modifiée(s)" :
   - Label : "Afficher les tâches terminées"
   - Composant `Switch` (déjà disponible dans le projet)
   - Afficher un compteur de tâches terminées masquées (ex: `(3 terminées)`)

4. **Cas particulier** : si une tâche est passée de "done" vers un autre statut dans le sélecteur, elle reste visible même si `showDone` est désactivé (car son `newStatus` n'est plus "done").

### Logique de filtrage

```ts
const visibleTasks = taskStatusUpdates.filter(task => {
  if (showDone) return true;
  // Montrer si le statut actuel n'est pas "done" OU si l'utilisateur a changé le statut
  return task.currentStatus !== "done" || task.currentStatus !== task.newStatus;
});
```

### Import à ajouter
- `Switch` depuis `@/components/ui/switch`
- `Label` depuis `@/components/ui/label`

