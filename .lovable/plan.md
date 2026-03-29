

# Refonte de la page "Mes taches" : vues multiples, lien projet, rafraichissement

## Contexte

La page actuelle affiche uniquement un tableau avec des filtres. L'utilisateur souhaite :
1. Plusieurs vues : tableau (existant), kanban, calendrier mensuel, timeline/Gantt
2. Un raccourci vers le projet depuis chaque tache
3. Un rafraichissement automatique (polling, conformement a la contrainte du projet d'eviter les WebSockets)

**Note** : Le projet utilise le polling au lieu de Supabase Realtime pour supporter les deployments auto-heberges. On implementera donc un auto-refresh periodique (30s) plutot que du temps reel.

## Plan d'implementation

### 1. Reorganiser la barre d'outils et ajouter le `ViewToggle`

Reutiliser le composant `ViewToggle` existant avec une nouvelle valeur `"calendar"` ajoutee au type `ViewMode`. Reorganiser la barre de filtres pour la rendre plus compacte : grouper les filtres sur une ligne, le toggle de vue sur une autre.

**Fichier** : `src/components/ViewToggle.tsx`
- Ajouter `"calendar"` au type `ViewMode`
- Ajouter le bouton calendrier avec une icone `Calendar`

### 2. Ajouter un lien vers le projet dans le tableau

Dans `TaskCard.tsx`, rendre le nom du projet cliquable avec un lien vers `/project/{project_id}`.

**Fichier** : `src/components/task/TaskCard.tsx`

### 3. Creer un composant `MyTasksKanban`

Composant adapte au contexte "mes taches" (multi-projets), affichant les taches en 3 colonnes (A faire / En cours / Termine). Chaque carte affiche le nom du projet (cliquable), le titre, la date. Permettre le changement de statut rapide via les fleches comme dans le Kanban existant.

**Fichier** : `src/components/task/MyTasksKanban.tsx`

### 4. Creer un composant `MyTasksCalendar`

Vue calendrier mensuel simple : grille de jours avec les taches positionnees sur leur `due_date`. Chaque cellule montre les taches sous forme de pastilles colorees par statut, cliquables pour ouvrir l'edition. Navigation mois precedent/suivant.

**Fichier** : `src/components/task/MyTasksCalendar.tsx`

### 5. Creer un composant `MyTasksTimeline`

Reutiliser le composant `TaskGantt` existant en l'adaptant au contexte multi-projets. Passer les taches filtrees et grouper par projet.

**Fichier** : integration dans `MyTasks.tsx` avec `TaskGantt` ou un wrapper dedie

### 6. Ajouter le polling auto-refresh

Dans `useMyTasks.tsx`, ajouter l'option `refetchInterval: 30000` a la query pour un rafraichissement automatique toutes les 30 secondes. Retirer le bouton "Actualiser" manuel devenu inutile (ou le conserver en complement).

**Fichier** : `src/hooks/useMyTasks.tsx`

### 7. Refactorer `MyTasks.tsx`

Integrer le `ViewToggle`, les 4 vues conditionnelles, le lien projet, et le polling.

**Fichier** : `src/pages/MyTasks.tsx`

## Fichiers impactes

| Fichier | Modification |
|---|---|
| `src/components/ViewToggle.tsx` | Ajout `"calendar"` au type `ViewMode` |
| `src/components/task/TaskCard.tsx` | Nom du projet cliquable (lien vers le projet) |
| `src/components/task/MyTasksKanban.tsx` | Nouveau composant Kanban multi-projets |
| `src/components/task/MyTasksCalendar.tsx` | Nouveau composant calendrier mensuel |
| `src/hooks/useMyTasks.tsx` | Ajout `refetchInterval: 30000` |
| `src/pages/MyTasks.tsx` | Integration des vues, reorganisation de la toolbar |

## Resultat attendu

```text
[Tableau] [Kanban] [Calendrier] [Timeline]     Filtres...

Vue tableau :  Projet (lien) | Titre | Statut | Date | Actions
Vue kanban  :  3 colonnes avec cartes groupees par projet
Vue calendrier : Grille mensuelle avec pastilles de taches
Vue timeline : Gantt simplifie multi-projets
```

Auto-refresh toutes les 30 secondes, transparent pour l'utilisateur.

