

# Actions contextuelles sur les feedbacks (administration)

## Contexte

Les feedbacks utilisateurs contiennent un type encodé dans le titre : `[Suppression de projet]`, `[Évolution]`, `[Bug]`, `[Demande de rôle]`. Le contenu des demandes de suppression inclut les noms de projets (`Projets à supprimer: ...`). Actuellement, l'admin ne peut que consulter, répondre ou supprimer un feedback -- aucune action directe n'est possible.

## Fonctionnalités proposées

### 1. Bouton "Supprimer le projet" sur les feedbacks de type suppression

Sur les cartes de feedback dont le titre commence par `[Suppression de projet]`, ajouter un bouton d'action qui :
- Parse le contenu pour extraire les IDs/noms des projets mentionnés
- Ouvre un `DeleteProjectDialog` (existant) avec confirmation
- Après suppression, marque visuellement le feedback comme "traité"

**Implémentation** : stocker les IDs de projets dans le contenu du feedback (actuellement seuls les titres sont stockés). Modifier `FeedbackForm.tsx` pour inclure les IDs en plus des titres. Dans `FeedbackCard.tsx`, détecter le type et afficher le bouton de suppression avec un dialog de confirmation.

### 2. Bouton "Créer une tâche" sur les feedbacks de type évolution

Sur les cartes de feedback dont le titre commence par `[Évolution]`, ajouter un bouton qui :
- Ouvre une modale de sélection de projet (réutiliser le pattern `Dialog` existant avec recherche)
- Pré-remplit un formulaire de création de tâche avec le titre et la description du feedback
- Crée la tâche via Supabase sur le projet sélectionné

### 3. Amélioration du format de stockage des feedbacks

Modifier le contenu du feedback de suppression pour inclure les IDs de projets sous un format parsable : `project_ids:id1,id2`. Cela permettra à l'admin de déclencher la suppression directement.

### 4. Badge de type de feedback sur les cartes

Ajouter un badge coloré sur chaque `FeedbackCard` indiquant le sous-type : Bug (rouge), Évolution (violet), Suppression (orange), Droits (bleu). Extraire le type depuis le préfixe du titre.

## Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/components/notifications/FeedbackCard.tsx` | Ajout badges de sous-type, boutons contextuels (supprimer projet, créer tâche) |
| `src/components/notifications/NotificationList.tsx` | Nouveaux callbacks et state pour les actions (suppression projet, création tâche), intégration des dialogs |
| `src/components/feedback/FeedbackForm.tsx` | Inclure les IDs de projets dans le contenu (format parsable) |
| `src/components/notifications/CreateTaskFromFeedbackDialog.tsx` | **Nouveau** : modale sélection projet + création de tâche pré-remplie |
| `src/components/notifications/DeleteProjectFromFeedbackDialog.tsx` | **Nouveau** : wrapper autour de `DeleteProjectDialog` avec parsing des projets du feedback |

## Detail technique

### Parsing du type de feedback
```typescript
function getFeedbackSubType(title: string): "bug" | "evolution" | "deletion" | "role" | "other" {
  if (title.startsWith("[Bug]")) return "bug";
  if (title.startsWith("[Évolution]")) return "evolution";
  if (title.startsWith("[Suppression de projet]")) return "deletion";
  if (title.startsWith("[Demande de rôle]")) return "role";
  return "other";
}
```

### Format enrichi du contenu (suppression)
```
project_ids:uuid1,uuid2
Projets à supprimer: Projet A, Projet B

Raison de la suppression...
```

### Modale de création de tâche depuis feedback
- Etape 1 : sélection du projet (liste avec recherche)
- Etape 2 : formulaire simplifié (titre pré-rempli, description pré-remplie, statut "todo")
- Appel `supabase.from("tasks").insert(...)` puis invalidation du cache

## Résultat attendu

```text
Onglet Feedback :
┌─────────────────────────────────────────────┐
│ 🟠 En attente          🔴 Bug              │
│ [Bug] Problème d'affichage                  │
│ par jean@mail.com · 28/03/2026              │
│                          [Répondre] [🗑]    │
├─────────────────────────────────────────────┤
│ 🟠 En attente          🟣 Évolution         │
│ [Évolution] Ajout export PDF                │
│ par marie@mail.com · 27/03/2026             │
│              [Créer tâche] [Répondre] [🗑]  │
├─────────────────────────────────────────────┤
│ 🟠 En attente          🟠 Suppression       │
│ [Suppression] Projet Alpha                  │
│ par paul@mail.com · 26/03/2026              │
│          [Supprimer projet] [Répondre] [🗑] │
└─────────────────────────────────────────────┘
```

