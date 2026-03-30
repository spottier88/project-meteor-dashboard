

# Correction : perte de focus après fermeture du dialogue de suppression

## Problème

Le `DeleteProjectDialog` utilise un `AlertDialog` (Radix UI) qui, à la fermeture, laisse `pointer-events: none` sur le `body`. Ce problème est connu dans le projet (cf. `ProjectClosureDialog` qui applique déjà un correctif avec `unlockPointerEvents`). Le `DeleteProjectDialog` ne gère ni le nettoyage de `pointer-events`, ni la restauration du focus via `onCloseAutoFocus`.

## Correction

### Fichier : `src/components/project/DeleteProjectDialog.tsx`

1. **Ajouter la fonction `unlockPointerEvents`** (même pattern que `ProjectClosureDialog`) pour réinitialiser `pointer-events` sur `body` et `documentElement`.

2. **Ajouter `onCloseAutoFocus`** sur `AlertDialogContent` pour intercepter la fermeture et :
   - Appeler `event.preventDefault()`
   - Appeler `unlockPointerEvents()`
   - Redonner le focus au `body`

3. **Appeler `unlockPointerEvents`** dans `onClose` et après `handleDelete` pour couvrir tous les cas de fermeture (annulation, suppression réussie, erreur).

### Détail technique

```typescript
// Fonction de nettoyage (identique à ProjectClosureDialog)
const unlockPointerEvents = () => {
  document.body.style.pointerEvents = "";
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.pointerEvents = "";
  document.documentElement.style.removeProperty("pointer-events");
};

// Sur AlertDialogContent
<AlertDialogContent
  onCloseAutoFocus={(event) => {
    event.preventDefault();
    unlockPointerEvents();
    document.body.focus();
  }}
>
```

### Fichier unique impacté

| Fichier | Modification |
|---|---|
| `src/components/project/DeleteProjectDialog.tsx` | Ajout `unlockPointerEvents` + `onCloseAutoFocus` |

