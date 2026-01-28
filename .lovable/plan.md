
# Plan d'implémentation : Notification par email lors de l'ajout d'une note de projet

## Objectif

Notifier par email les membres du projet (chef de projet, chef de projet secondaire, membres) lorsqu'une nouvelle note est ajoutée au projet, en s'appuyant sur le système de notification existant.

---

## Architecture existante identifiée

### Système de notifications email
1. **Table `email_notification_queue`** : File d'attente des notifications email
   - `user_id` : Destinataire de la notification
   - `event_type` : Type d'événement (contrainte CHECK)
   - `event_data` : Données JSON de l'événement
   - Traitée par la fonction Edge `send-email-digest`

2. **Types d'événements autorisés** (contrainte actuelle) :
   - `task_assigned`, `project_assigned`, `role_changed`, `user_signup`, `admin_feedback`, `portfolio_review`

3. **Membres d'un projet** :
   - Chef de projet principal : `projects.project_manager_id`
   - Chefs de projet secondaires : `project_members` avec `role = 'secondary_manager'`
   - Membres : `project_members` avec `role = 'member'`

### Hook de création de notes
- **`src/hooks/useProjectNotes.ts`** : Gère le CRUD des notes via React Query
- La mutation `createNote` insère dans `project_notes` et invalide le cache

---

## Fichiers à modifier/créer

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/migrations/XXXXXX_add_project_note_event_type.sql` | Créer | Ajouter `project_note_added` à la contrainte |
| `src/hooks/useProjectNotes.ts` | Modifier | Ajouter l'envoi des notifications après création |
| `supabase/functions/send-email-digest/index.ts` | Modifier | Ajouter le traitement du type `project_note_added` |

---

## Détails techniques

### 1. Migration SQL : Ajouter le nouveau type d'événement

Créer une nouvelle migration pour ajouter `project_note_added` à la contrainte CHECK :

```sql
-- Supprimer l'ancienne contrainte
ALTER TABLE public.email_notification_queue 
DROP CONSTRAINT IF EXISTS email_notification_queue_event_type_check;

-- Recréer la contrainte avec le nouveau type
ALTER TABLE public.email_notification_queue 
ADD CONSTRAINT email_notification_queue_event_type_check 
CHECK (event_type IN (
  'task_assigned',
  'project_assigned',
  'role_changed',
  'user_signup',
  'admin_feedback',
  'portfolio_review',
  'project_note_added'  -- Nouveau type
));
```

---

### 2. Modification de `src/hooks/useProjectNotes.ts`

#### A. Ajouter une fonction pour récupérer les membres du projet

```typescript
/**
 * Récupère tous les membres à notifier pour un projet
 * (chef de projet, chefs secondaires, membres)
 * Exclut l'auteur de la note
 */
const getProjectMembersToNotify = async (
  projectId: string, 
  excludeUserId: string
): Promise<Array<{ userId: string; email: string; role: string }>> => {
  const members: Array<{ userId: string; email: string; role: string }> = [];

  // 1. Récupérer le chef de projet principal
  const { data: project } = await supabase
    .from("projects")
    .select(`
      project_manager_id,
      profiles!projects_project_manager_id_fkey (
        id,
        email
      )
    `)
    .eq("id", projectId)
    .single();

  if (project?.project_manager_id && 
      project.project_manager_id !== excludeUserId &&
      project.profiles?.email) {
    members.push({
      userId: project.project_manager_id,
      email: project.profiles.email,
      role: 'project_manager'
    });
  }

  // 2. Récupérer les membres du projet (secondaires et membres)
  const { data: projectMembers } = await supabase
    .from("project_members")
    .select(`
      user_id,
      role,
      profiles:user_id (
        id,
        email
      )
    `)
    .eq("project_id", projectId)
    .neq("user_id", excludeUserId);

  projectMembers?.forEach(member => {
    if (member.profiles?.email) {
      members.push({
        userId: member.user_id,
        email: member.profiles.email,
        role: member.role
      });
    }
  });

  return members;
};
```

#### B. Ajouter une fonction pour envoyer les notifications

```typescript
/**
 * Ajoute les notifications email pour une nouvelle note de projet
 */
const sendNoteNotifications = async (
  note: ProjectNote,
  projectId: string,
  authorId: string
) => {
  try {
    // Récupérer les informations du projet
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    // Récupérer les membres à notifier (exclure l'auteur)
    const membersToNotify = await getProjectMembersToNotify(projectId, authorId);

    if (membersToNotify.length === 0) {
      console.log("Aucun membre à notifier pour cette note");
      return;
    }

    // Préparer le libellé du type de note
    const noteTypeLabels: Record<string, string> = {
      meeting: 'Réunion',
      memo: 'Mémo',
      decision: 'Décision',
      other: 'Autre'
    };

    // Créer les entrées de notification pour chaque membre
    const notifications = membersToNotify.map(member => ({
      user_id: member.userId,
      event_type: 'project_note_added',
      event_data: {
        project_id: projectId,
        project_title: project?.title || 'Projet sans titre',
        note_id: note.id,
        note_type: note.note_type,
        note_type_label: noteTypeLabels[note.note_type] || note.note_type,
        note_content_preview: note.content.substring(0, 150) + 
          (note.content.length > 150 ? '...' : ''),
        author_name: [note.author?.first_name, note.author?.last_name]
          .filter(Boolean).join(' ') || 'Utilisateur',
        author_email: note.author?.email || '',
        created_at: note.created_at,
      }
    }));

    // Insérer dans la file de notifications
    const { error } = await supabase
      .from("email_notification_queue")
      .insert(notifications);

    if (error) {
      console.error("Erreur lors de l'ajout des notifications de note:", error);
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi des notifications de note:", error);
    // Non bloquant - la note est déjà créée
  }
};
```

#### C. Modifier la mutation `createNote`

Appeler `sendNoteNotifications` après la création réussie de la note :

```typescript
const createNote = useMutation({
  mutationFn: async (input: CreateProjectNoteInput) => {
    if (!user?.id) throw new Error("Utilisateur non connecté");

    const { data, error } = await supabase
      .from("project_notes")
      .insert({
        project_id: input.project_id,
        author_id: user.id,
        content: input.content,
        note_type: input.note_type,
      })
      .select(`
        *,
        author:profiles!project_notes_author_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) throw error;
    
    // Envoyer les notifications aux membres du projet (non bloquant)
    sendNoteNotifications(data as ProjectNote, input.project_id, user.id);
    
    return data as ProjectNote;
  },
  // ... reste inchangé
});
```

---

### 3. Modification de `supabase/functions/send-email-digest/index.ts`

#### A. Ajouter les fonctions de génération HTML/texte pour les notes

```typescript
/**
 * Génère la liste HTML des notes de projet
 */
function generateNotesListHtml(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      const createdAt = data.created_at 
        ? new Date(data.created_at as string).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
          })
        : '';
      return `<div class="item">
        <div class="item-title">${data.project_title || 'Projet'}</div>
        <div class="item-meta">
          <span class="badge badge-note">${data.note_type_label || 'Note'}</span>
          <span style="margin-left: 10px;">Par : ${data.author_name || 'Inconnu'}</span>
          <span style="margin-left: 10px;">${createdAt}</span>
        </div>
        <div class="item-preview" style="margin-top: 8px; color: #6b7280; font-size: 13px;">
          ${data.note_content_preview || ''}
        </div>
      </div>`;
    })
    .join('');
}

/**
 * Génère la liste texte des notes de projet
 */
function generateNotesListText(notifications: Array<{ event_data: Record<string, unknown> }>): string {
  return notifications
    .map(n => {
      const data = n.event_data;
      const createdAt = data.created_at 
        ? new Date(data.created_at as string).toLocaleDateString('fr-FR') 
        : '';
      return `- [${data.note_type_label || 'Note'}] ${data.project_title || 'Projet'} - Par ${data.author_name || 'Inconnu'} (${createdAt})`;
    })
    .join('\n');
}
```

#### B. Modifier le traitement des notifications

Dans la boucle de traitement des utilisateurs, ajouter le filtrage et l'intégration des notes :

```typescript
// Séparer les notifications par type (ajouter les notes)
const taskNotifs = data.notifications.filter(n => n.event_type === 'task_assigned');
const projectNotifs = data.notifications.filter(n => n.event_type === 'project_assigned');
const roleNotifs = data.notifications.filter(n => n.event_type === 'role_changed');
const signupNotifs = data.notifications.filter(n => n.event_type === 'user_signup');
const feedbackNotifs = data.notifications.filter(n => n.event_type === 'admin_feedback');
const noteNotifs = data.notifications.filter(n => n.event_type === 'project_note_added'); // Nouveau

// Préparer les variables de publipostage (ajouter les notes)
const variables: Record<string, string | boolean | number> = {
  // ... variables existantes ...
  
  // Notes de projet (nouveau)
  has_notes: noteNotifs.length > 0,
  notes_count: noteNotifs.length,
  notes_list: generateNotesListHtml(noteNotifs),
  notes_list_text: generateNotesListText(noteNotifs),
};
```

---

### 4. Mise à jour du template email `daily_digest`

Le template d'email devra inclure une section conditionnelle pour les notes. Voici un exemple de bloc à ajouter au template HTML existant :

```html
{{#if has_notes}}
<div class="section">
  <h2>📝 Notes de projet ({{notes_count}})</h2>
  {{{notes_list}}}
</div>
{{/if}}
```

---

## Résumé des modifications

| Fichier | Modifications |
|---------|---------------|
| Migration SQL | Ajouter `project_note_added` à la contrainte `event_type` |
| `useProjectNotes.ts` | Ajouter `getProjectMembersToNotify`, `sendNoteNotifications`, modifier `createNote` |
| `send-email-digest/index.ts` | Ajouter `generateNotesListHtml`, `generateNotesListText`, filtrer et traiter `project_note_added` |
| Template email (via interface admin) | Ajouter bloc conditionnel pour les notes |

---

## Flux de notification

```text
┌─────────────────────────────────────────────────────────────────┐
│           Utilisateur crée une note de projet                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ createNote (useProjectNotes)  │
              │ → INSERT dans project_notes   │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ sendNoteNotifications()       │
              │ → Récupère membres du projet  │
              │ → Exclut l'auteur de la note  │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ INSERT email_notification_queue│
              │ event_type = project_note_added│
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ send-email-digest (cron)      │
              │ → Inclut notes dans le digest │
              │ → Envoi email groupé          │
              └───────────────────────────────┘
```

---

## Destinataires des notifications

| Rôle | Notification |
|------|--------------|
| Chef de projet principal | ✅ Notifié (sauf s'il est l'auteur) |
| Chef de projet secondaire | ✅ Notifié (sauf s'il est l'auteur) |
| Membre du projet | ✅ Notifié (sauf s'il est l'auteur) |
| Auteur de la note | ❌ Non notifié |

---

## Avantages de cette solution

1. **Intégration native** : Utilise le système de notification existant (`email_notification_queue`)
2. **Non intrusif** : L'ajout de notifications est non bloquant (erreurs loguées mais ignorées)
3. **Groupé dans le digest** : Les notifications sont regroupées dans l'email quotidien
4. **Respecte les préférences** : Les utilisateurs ayant désactivé les notifications ne recevront pas d'email
5. **Extensible** : La structure permet d'ajouter facilement d'autres types d'événements

