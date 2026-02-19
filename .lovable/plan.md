

# Evolution du changement de statut des taches

## Constat actuel

Le changement de statut d'une tache repose actuellement sur une **liste deroulante classique** (`Select`) dans le formulaire d'edition. Ce fonctionnement presente plusieurs inconvenients :
- Il faut **ouvrir le formulaire complet** pour simplement changer un statut
- La liste deroulante n'offre pas de retour visuel immediat sur la progression
- Le flux "A faire > En cours > Termine" n'est pas represente visuellement

## Evolution proposee : Boutons de progression contextuelle

Remplacer la liste deroulante par un **groupe de boutons visuels** representant le flux de progression de la tache, et ajouter un **changement rapide de statut** directement depuis les vues tableau et Kanban (sans ouvrir le formulaire).

### 1. Dans le formulaire d'edition (`TaskFormContent.tsx`)

Remplacer le `Select` par **3 boutons cote a cote** representant les etapes :

```text
[ O A faire ]  [ > En cours ]  [ v Termine ]
     gris           bleu            vert
```

- Chaque bouton affiche une icone et un label
- Le bouton actif est mis en evidence (fond colore, bordure)
- Les boutons inactifs restent cliquables mais en style attenue
- Le clic sur un bouton change immediatement le statut
- Le champ "Bilan / Resultat" apparait toujours conditionnellement quand "Termine" est selectionne

### 2. Changement rapide dans le tableau (`TaskTable.tsx`)

Rendre le **badge de statut cliquable** dans la colonne "Statut" :
- Au clic sur le badge, le statut passe a l'etape suivante (todo > in_progress > done)
- Mise a jour directe en base sans ouvrir le formulaire
- Animation subtile de transition
- Le badge cliquable affiche un curseur pointer et un tooltip "Cliquer pour avancer le statut"
- Desactive si le projet est cloture ou si l'utilisateur n'a pas les droits d'edition

### 3. Changement rapide dans le Kanban (`KanbanBoard.tsx`)

Ajouter de **petits boutons fleches** sur les cartes :
- Fleche droite pour avancer au statut suivant
- Fleche gauche pour revenir au statut precedent
- Visibles au survol de la carte uniquement (pour ne pas surcharger)
- Mise a jour directe en base avec rafraichissement de la vue

---

## Details techniques

### Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `src/components/task/TaskStatusButtons.tsx` | Composant reutilisable de boutons de statut (3 boutons avec icones) |

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/task/TaskFormContent.tsx` | Remplacer le `Select` par `TaskStatusButtons` |
| `src/components/task/TaskTable.tsx` | Rendre le badge de statut cliquable avec progression rapide |
| `src/components/KanbanBoard.tsx` | Ajouter les boutons fleches de navigation entre statuts |

### Composant `TaskStatusButtons`

Ce composant encapsule la logique des 3 boutons de statut :
- Props : `status`, `onStatusChange`, `disabled`, `readOnly`
- Utilise `ToggleGroup` de Radix (deja installe) pour le comportement de selection exclusive
- Icones : `Circle` (A faire), `Clock` (En cours), `CheckCircle2` (Termine)
- Style : le bouton actif a un fond colore + bordure, les autres sont en variante `outline`

### Changement rapide (tableau et Kanban)

La logique de mise a jour rapide sera une fonction partagee :

```text
Fonction cycleTaskStatus(taskId, currentStatus) :
  - todo -> in_progress
  - in_progress -> done
  - done -> todo (retour au debut)
  - Met a jour en base (supabase.update)
  - Invalide le cache React Query
  - Affiche un toast de confirmation
```

Pour le Kanban, deux fonctions distinctes (avancer / reculer) au lieu du cycle.

### Gestion des permissions

Les actions rapides respectent les memes permissions que l'edition :
- `canEditTask(assignee)` pour verifier le droit
- `isProjectClosed` pour bloquer les modifications

---

## Sequencement

1. Creer `TaskStatusButtons.tsx` (composant reutilisable)
2. Modifier `TaskFormContent.tsx` (remplacer Select par TaskStatusButtons)
3. Modifier `TaskTable.tsx` (badge cliquable avec progression rapide)
4. Modifier `KanbanBoard.tsx` (boutons fleches sur les cartes)

