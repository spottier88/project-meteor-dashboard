

# Ajout de notes depuis le mode présentation

## Objectif

Permettre au présentateur d'ajouter une note (compte-rendu, décision, mémo) sur le projet affiché, directement depuis la slide de présentation, en réutilisant le système de notes existant (`project_notes`).

## Approche

Ajouter un bouton dans la barre de navigation de la présentation qui ouvre un dialogue modal contenant un formulaire simplifié de note. La note est enregistrée via le hook `useProjectNotes` existant, ce qui déclenche automatiquement les notifications email aux membres du projet.

## Plan

### 1. Nouveau composant `PresentationNoteDialog`

Créer `src/components/presentation/PresentationNoteDialog.tsx` :
- Un `Dialog` contenant un sélecteur de type de note et un `Textarea`
- Props : `projectId`, `projectTitle`, `isOpen`, `onClose`
- Utilise `useProjectNotes(projectId)` en interne pour appeler `createNote.mutate`
- Affiche un toast de confirmation à la soumission
- Pré-sélectionner le type "meeting" (cas d'usage principal : revue de projet)

### 2. Modifier `PresentationView.tsx`

- Ajouter un state `isNoteDialogOpen`
- Passer le `projectId` et le `projectTitle` du projet courant au dialogue
- Passer un callback `onAddNote` à `PresentationNavigation`
- Masquer le bouton si on est sur la slide de synthèse (pas de projet courant)

### 3. Modifier `PresentationNavigation.tsx`

- Ajouter une prop optionnelle `onAddNote?: () => void`
- Afficher un bouton (icône `StickyNote` ou `MessageSquarePlus`) dans la barre, entre les contrôles existants
- Le bouton n'apparaît que si `onAddNote` est fourni (masqué sur la slide de synthèse)

### Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/presentation/PresentationNoteDialog.tsx` | Nouveau |
| `src/components/presentation/PresentationView.tsx` | Ajout state + dialogue |
| `src/components/presentation/PresentationNavigation.tsx` | Ajout bouton |

### Aucune modification base de données

Le système réutilise intégralement la table `project_notes` et le hook `useProjectNotes` existants, y compris les notifications email.

