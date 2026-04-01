

# Correction : pré-remplissage du formulaire de création de tâche depuis un feedback évolution

## Problème

Le `CreateTaskFromFeedbackDialog` initialise `title` et `description` via `useState(defaultTitle)` et `useState(defaultDescription)`. Or `useState` ne prend en compte la valeur initiale qu'au premier rendu. Quand le dialog s'ouvre avec de nouvelles props, les champs restent vides (valeurs du premier montage).

## Correction

Ajouter un `useEffect` qui synchronise `title` et `description` quand le dialog s'ouvre (`open` passe à `true`) ou quand `defaultTitle`/`defaultDescription` changent.

### Fichier impacté

| Fichier | Modification |
|---|---|
| `src/components/notifications/CreateTaskFromFeedbackDialog.tsx` | Ajout d'un `useEffect` pour synchroniser les champs avec les props à l'ouverture |

### Code

```tsx
// Ajouter après les useState (ligne 46)
import { useState, useEffect } from "react";

useEffect(() => {
  if (open) {
    setTitle(defaultTitle);
    setDescription(defaultDescription);
  }
}, [open, defaultTitle, defaultDescription]);
```

Cela garantit que chaque ouverture du dialog reflète les données du feedback sélectionné.

