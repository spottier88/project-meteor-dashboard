

# Réponse automatique au feedback après suppression de projet — Plan d'implémentation

## Objectif

Lorsqu'un administrateur supprime un projet depuis le `DeleteProjectFromFeedbackDialog`, l'application crée automatiquement une notification de réponse au feedback pour informer l'utilisateur demandeur que la suppression a été effectuée.

## Principe

Réutiliser exactement la même logique que `FeedbackResponseForm.handleSubmit` (création notification + cible + user_notification), mais de manière automatique après chaque suppression réussie, avec un message pré-rédigé.

## Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/components/notifications/NotificationList.tsx` | Passer le feedback complet (notification) au `DeleteProjectFromFeedbackDialog` au lieu du seul `feedbackContent` |
| `src/components/notifications/DeleteProjectFromFeedbackDialog.tsx` | Recevoir le feedback complet. Après chaque suppression réussie, créer automatiquement une réponse ciblée à l'utilisateur demandeur |

## Détail technique

### 1. `NotificationList.tsx`

- Stocker la notification complète au lieu du seul `content` :
  ```ts
  const [deleteProjectFeedback, setDeleteProjectFeedback] = useState<NotificationWithProfile | null>(null);
  ```
- Passer `feedback={deleteProjectFeedback}` au composant.

### 2. `DeleteProjectFromFeedbackDialog.tsx`

- Changer la prop `feedbackContent: string` en `feedback: Notification` (le type existant).
- Extraire `feedbackContent` depuis `feedback.content` pour le parsing des IDs.
- Dans `handleDeleteProject`, après la suppression réussie, ajouter une fonction `sendAutoResponse` qui :
  1. Crée une notification avec titre `Réponse à votre demande: {feedback.title}` et contenu indiquant que le projet "{projectTitle}" a été supprimé.
  2. Crée un `notification_target` de type `specific`.
  3. Crée un `notification_target_users` ciblant `feedback.created_by`.
  4. Crée un `user_notifications` pour que l'utilisateur voie la réponse.
- La réponse automatique n'est envoyée qu'une seule fois à la fermeture du dialogue (ou après chaque suppression individuelle — à la fermeture est préférable pour regrouper les noms de projets supprimés dans un seul message).

### 3. Comportement choisi : réponse groupée à la fermeture

- Collecter les noms des projets supprimés dans un état local.
- À la fermeture du dialogue (`handleClose`), si au moins un projet a été supprimé, envoyer une unique réponse automatique listant tous les projets supprimés.
- Contenu type : `Votre demande de suppression a été traitée. Les projets suivants ont été supprimés : Projet A, Projet B.`

## Ce qui ne change pas

- Le `FeedbackResponseForm` (réponse manuelle) reste intact et indépendant.
- Les autres fonctionnalités de notification ne sont pas impactées.
- La logique de parsing des IDs et de suppression Supabase reste identique.

