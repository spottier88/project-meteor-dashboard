

# Correction : défilement manquant pour les feedbacks longs

## Problème

Deux zones affichent du contenu de feedback sans contrainte de hauteur ni barre de défilement :

1. **Consultation du feedback** (Sheet de lecture, ligne 199-234 de `NotificationList.tsx`) : le contenu s'affiche via `<p className="whitespace-pre-wrap">` sans limite de hauteur — un texte long déborde hors de la zone visible.

2. **Réponse au feedback** (`FeedbackResponseForm.tsx`, ligne 139-142) : la zone "Feedback original" (`<div className="bg-muted p-4 rounded-md">`) affiche le texte intégral sans défilement.

## Plan de correction

### 1. Sheet de consultation (`NotificationList.tsx`)

Ajouter `overflow-y-auto` et `max-h-[50vh]` sur le conteneur du contenu textuel (ligne 207) pour permettre le défilement quand le texte est long.

```tsx
// Avant
<p className="whitespace-pre-wrap">{selectedContent.content}</p>

// Après
<div className="max-h-[50vh] overflow-y-auto">
  <p className="whitespace-pre-wrap">{selectedContent.content}</p>
</div>
```

### 2. Zone feedback original dans le formulaire de réponse (`FeedbackResponseForm.tsx`)

Ajouter `max-h-[30vh] overflow-y-auto` sur le conteneur `bg-muted` (ligne 139) pour limiter la hauteur du feedback cité et permettre le défilement.

```tsx
// Avant
<div className="bg-muted p-4 rounded-md">

// Après
<div className="bg-muted p-4 rounded-md max-h-[30vh] overflow-y-auto">
```

### Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/components/notifications/NotificationList.tsx` | Ajout `max-h-[50vh] overflow-y-auto` sur le contenu de la sheet de lecture |
| `src/components/notifications/FeedbackResponseForm.tsx` | Ajout `max-h-[30vh] overflow-y-auto` sur la zone feedback original |

