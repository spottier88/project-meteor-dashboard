# Integration avancee SVAR Gantt — Scenarios d'implementation

## Fonctionnalites disponibles en open-source SVAR

Apres analyse de la documentation, voici les capacites exploitables sans licence PRO :


| Fonctionnalite                                   | Disponible OS | Statut actuel                     |
| ------------------------------------------------ | ------------- | --------------------------------- |
| Drag & drop des barres (deplacer/redimensionner) | Oui           | Deja implemente                   |
| Modification de la progression par drag          | Oui           | Non utilise                       |
| Ajout de tache via bouton "+" dans la grille     | Oui           | Non utilise                       |
| Editeur de tache (modal/sidebar)                 | Oui           | Non utilise                       |
| Menu contextuel (clic droit)                     | Oui           | Non utilise                       |
| Tooltips au survol                               | Oui           | Non utilise                       |
| Colonnes de grille configurables                 | Oui           | Non utilise (colonnes par defaut) |
| Liens de dependances visuels (fleches)           | Oui           | Non utilise                       |
| Interception d'actions (api.intercept)           | Oui           | Non utilise                       |
| Types de taches (task, milestone, summary)       | Oui           | Partiel (task/summary)            |
| Reordonnancement par drag dans la grille         | Oui           | Non controle                      |


---

## Propositions d'implementation

### 1. Menu contextuel sur les taches

Ajouter un `<ContextMenu>` SVAR autour du `<Gantt>` dans `TaskGantt.tsx` avec les options :

- **Modifier** → ouvre le `TaskForm` existant (meme comportement que le double-clic en vue tableau)
- **Ajouter une sous-tache** → ouvre le `TaskForm` en mode creation avec `parent_task_id` pre-rempli
- **Supprimer** → declenche la confirmation de suppression existante

Le `resolver` SVAR permet de limiter le menu aux utilisateurs ayant les droits (`canEditTask`, `canDeleteTask`). Le `filter` permet de masquer "Supprimer" sur les taches de type summary.

**Fichiers** : `TaskGantt.tsx`

---

### 2. Editeur de tache integre (intercept show-editor → TaskForm existant)

Au double-clic sur une tache dans le Gantt, intercepter l'action `show-editor` de SVAR et ouvrir le `TaskForm` existant de l'application avec les donnees de la tache selectionnee.

Cela reutilise toute la logique metier existante (permissions, validation, persistance Supabase) sans reimplementer un editeur.

**Mecanisme** :

```
api.intercept("show-editor", (data) => {
  const task = localTasks.find(t => t.id === data.id);
  if (task && canEditTask) onEdit?.(task);
  return false; // bloque l'editeur SVAR natif
});
```

**Fichiers** : `TaskGantt.tsx`

---

### 3. Ajout de tache depuis la grille (bouton "+")

La colonne `add-task` est incluse par defaut dans SVAR. Elle affiche un "+" sur chaque ligne pour ajouter une sous-tache. Intercepter l'action `add-task` pour ouvrir le `TaskForm` en mode creation avec le `parent_task_id` pre-rempli.

Pour ajouter une tache racine, intercepter `add-task` quand il est declenche sur une tache summary (projet) et ouvrir le formulaire sans parent.

**Fichiers** : `TaskGantt.tsx`

---

### 4. Colonnes de grille personnalisees

Remplacer les colonnes par defaut par une configuration adaptee au contexte :

```
columns = [
  { id: "text", header: "Tache", flexgrow: 2 },
  { id: "start", header: "Debut", flexgrow: 1, align: "center" },
  { id: "end", header: "Fin", flexgrow: 1, align: "center" },
  { id: "progress", header: "%", width: 60, align: "center" },
  { id: "add-task", header: "", width: 50, align: "center" },
]
```

Masquer la colonne `add-task` si le projet est cloture ou si l'utilisateur n'a pas les droits de creation.

**Fichiers** : `TaskGantt.tsx`

---

---

### 5. Blocage du reordonnancement dans la grille

SVAR permet par defaut le drag & drop pour reordonner les taches dans la grille (changer leur position/parent). Ce comportement n'a pas de sens dans l'application car l'ordre et la hierarchie sont geres via le formulaire.

Intercepter `drag-task` pour bloquer le reordonnancement :

```
api.intercept("drag-task", (ev) => {
  if (typeof ev.top !== "undefined") return false;
});
```

**Fichiers** : `TaskGantt.tsx`

---

### 6. Modification de la progression par drag sur la barre

SVAR permet de modifier la progression (0-100%) en faisant glisser un curseur sur la barre. Actuellement la progression est calculee automatiquement depuis le statut (todo=0, in_progress=50, done=100).

- **Bloquer** cette fonctionnalite (car le statut pilote la progression) en interceptant `update-task` quand seul `progress` change
  &nbsp;

**Fichiers** : `TaskGantt.tsx`, `gantt-helpers.ts`

---

### 7. Blocage des interactions en mode lecture seule (vues panier/portefeuille)

Deja partiellement en place via `readonly={true}`. Confirmer que les vues `ProjectGanttSheet` et `PortfolioGanttSheet` n'affichent pas le menu contextuel, l'editeur, ni le bouton "+". Cela est garanti par defaut quand `readonly` est actif, mais a verifier.

**Fichiers** : `ProjectGanttSheet.tsx`, `PortfolioGanttSheet.tsx`

---

---

## Synthese des priorites suggerees


| #      | Fonctionnalite                                 | Effort  | Impact utilisateur |
| ------ | ---------------------------------------------- | ------- | ------------------ |
| 2      | Editeur via double-clic (intercept → TaskForm) | Faible  | Fort               |
| 1      | Menu contextuel (modifier/ajouter/supprimer)   | Faible  | Fort               |
| 5      | Bloquer le reordonnancement grille             | Trivial | Securite           |
| 4      | Colonnes de grille personnalisees              | Faible  | Moyen              |
| &nbsp; | &nbsp;                                         | &nbsp;  | &nbsp;             |
| 6      | Ajout tache via "+"                            | Faible  | Moyen              |
| &nbsp; | &nbsp;                                         | &nbsp;  | &nbsp;             |
| 7      | Verification readonly vues transversales       | Trivial | Securite           |
| &nbsp; | &nbsp;                                         | &nbsp;  | &nbsp;             |


### Fichiers principalement impactes

- `src/components/task/TaskGantt.tsx` — tous les ajouts sauf dependances
- `src/components/TaskList.tsx` — callbacks supplementaires (onAdd, onDelete depuis Gantt)
- `src/utils/gantt-helpers.ts` — enrichissement du mapping (progression, colonnes)
- Nouveau : `src/components/task/GanttTooltipContent.tsx`
- Optionnel (dependances) : migration SQL + `gantt-helpers.ts`