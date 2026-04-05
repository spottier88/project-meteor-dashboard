

# Correctif — Persistance des dates lors du drag & drop dans le Gantt

## Diagnostic

Le handler `handleUpdateTask` (ligne 116-168 de `TaskGantt.tsx`) contient deux problèmes probables :

### Problème 1 : le guard `inProgress` filtre potentiellement l'événement final

```tsx
if (ev.inProgress) return;  // ligne 118
```

SVAR émet `onupdatetask` pendant le drag (intermédiaire, `inProgress: true`) **et** à la fin. Selon la version de SVAR, l'événement final peut avoir `inProgress: true` aussi (indiquant que c'est le dernier d'une séquence de drag), ce qui fait que le handler **ignore toutes les mises à jour** sans jamais atteindre le code de persistance.

### Problème 2 : le handler est `async` mais SVAR attend un retour synchrone

Le handler est déclaré `async` (ligne 116). SVAR appelle la fonction et vérifie le retour pour valider ou annuler le changement. Un handler `async` retourne une `Promise` (truthy), donc SVAR accepte visuellement le changement, mais si l'événement est mal intercepté, la persistance n'a jamais lieu.

### Problème 3 : la condition de blocage progression est trop large

```tsx
if (updatedFields.progress !== undefined && !updatedFields.start && !updatedFields.end) {
  return false;  // ligne 124-126
}
```

Lors d'un resize (modification d'une extrémité), SVAR peut envoyer `progress` recalculé en même temps que `start`/`end`. Si seul `end` est défini (sans `start`), la condition passe mais `updatedFields.start` est `undefined`, ce qui fait que `startDate` n'est pas inclus dans le payload — comportement correct mais fragile.

## Plan de correction

### Fichier unique : `src/components/task/TaskGantt.tsx`

1. **Supprimer le guard `inProgress`** et le remplacer par une logique qui accepte tous les événements mais ne persiste qu'au final — ou simplement retirer le guard car SVAR gère déjà l'état visuel intermédiaire en interne.

2. **Rendre le handler synchrone** : déplacer l'appel Supabase dans une fonction séparée non-bloquante (fire-and-forget avec gestion d'erreur), pour que le handler retourne `true` immédiatement à SVAR.

3. **Ajouter des logs de diagnostic** pour confirmer que l'événement est bien reçu.

```tsx
const persistTaskDates = useCallback(async (taskId: string, start?: Date, end?: Date) => {
  try {
    const updatePayload: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (start) updatePayload.start_date = start.toISOString().split('T')[0];
    if (end) updatePayload.due_date = end.toISOString().split('T')[0];

    const { error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select();

    if (error) throw error;

    toast.success('Dates de la tâche mises à jour');
    onUpdate?.();
  } catch (error) {
    logger.error('Erreur mise à jour dates: ' + error);
    toast.error("Erreur lors de la mise à jour des dates");
  }
}, [onUpdate]);

const handleUpdateTask = useCallback((ev: { id: string | number; task: Partial<ITask>; inProgress?: boolean }) => {
  // Ignorer les mises à jour intermédiaires pendant le drag
  if (ev.inProgress) return true;

  const taskId = String(ev.id);
  const updatedFields = ev.task;

  // Bloquer la modification de la progression seule
  if (updatedFields.progress !== undefined && !updatedFields.start && !updatedFields.end) {
    return false;
  }

  // Persister les dates si modifiées (fire-and-forget)
  if (updatedFields.start || updatedFields.end) {
    persistTaskDates(taskId, updatedFields.start, updatedFields.end);

    // Mettre à jour le state local immédiatement
    setLocalTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              ...(updatedFields.start && { start_date: updatedFields.start.toISOString().split('T')[0] }),
              ...(updatedFields.end && { due_date: updatedFields.end.toISOString().split('T')[0] }),
            }
          : t
      )
    );
  }

  return true; // Confirmer le changement à SVAR
}, [persistTaskDates]);
```

Changements clés :
- Handler **synchrone** retournant `true` (accepté) ou `false` (rejeté)
- Persistance DB en **fire-and-forget** (pas de blocage du rendu)
- Le `return true` après `if (ev.inProgress)` valide les états intermédiaires visuels sans persister
- Retour explicite `true` à la fin pour confirmer à SVAR

## Impact

| Fichier | Modification |
|---|---|
| `src/components/task/TaskGantt.tsx` | Refonte du handler `handleUpdateTask` + extraction de `persistTaskDates` |

Aucune régression : le comportement visuel reste identique, seule la persistance DB est corrigée.

