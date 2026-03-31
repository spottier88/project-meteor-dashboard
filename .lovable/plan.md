

# Refonte de l'affichage des notifications (administration)

## Problemes actuels

1. **Liste plate** : tous les types (systeme, utilisateur, feedback) sont melanges dans un seul tableau sans distinction visuelle.
2. **Pas de lien question/reponse** : quand un admin repond a un feedback, la reponse est creee comme notification separee sans lien visible avec le feedback d'origine.
3. **Pas de filtre par type** : l'admin doit parcourir toute la liste pour trouver les feedbacks non traites.
4. **Pas d'indicateur de traitement** : impossible de savoir si un feedback a deja recu une reponse.

## Plan d'implementation

### 1. Ajouter des onglets par type de notification

Remplacer le tableau unique par une interface a onglets (Tabs) : **Toutes** | **Systeme** | **Feedback** | **Utilisateur**. Cela permet a l'admin de se concentrer sur un type a la fois, notamment les feedbacks a traiter.

**Fichier** : `src/pages/NotificationManagement.tsx`

### 2. Ajouter des badges visuels par type et statut

Dans la liste, remplacer le texte brut du type et du statut par des `Badge` colores :
- Systeme : bleu
- Feedback : orange
- Utilisateur : vert
- Statut publie/non publie : badge distinct

**Fichier** : `src/components/notifications/NotificationList.tsx`

### 3. Lier visuellement feedbacks et reponses

La reponse a un feedback est creee avec le titre `"Reponse a votre demande: {titre}"`. Exploiter ce pattern pour :
- Dans l'onglet Feedback, afficher chaque feedback avec sa reponse associee en dessous (sous-ligne indentee ou section depliable).
- Ajouter un indicateur "Repondu" / "En attente" sur chaque feedback.

La detection se fait cote requete : joindre les notifications de type `user` dont le titre commence par `"Reponse a votre demande:"` et correspond au titre du feedback.

**Fichier** : `src/components/notifications/NotificationList.tsx`

### 4. Passer d'un tableau a des cartes pour les feedbacks

Dans l'onglet Feedback, utiliser un affichage en cartes plutot qu'un tableau pour une meilleure lisibilite :
- Carte avec : auteur, date, contenu tronque, badge statut (repondu/en attente)
- Clic pour ouvrir le detail avec la reponse eventuelle

**Fichier** : nouveau composant `src/components/notifications/FeedbackCard.tsx`

### 5. Conserver le tableau pour les notifications systeme/utilisateur

Les notifications systeme et utilisateur restent en tableau classique mais avec les badges visuels.

## Fichiers impactes

| Fichier | Modification |
|---|---|
| `src/pages/NotificationManagement.tsx` | Ajout des Tabs (onglets par type) |
| `src/components/notifications/NotificationList.tsx` | Badges, filtre par type, detection des reponses aux feedbacks, indicateur repondu/en attente |
| `src/components/notifications/FeedbackCard.tsx` | Nouveau : carte feedback avec lien vers reponse |

## Resultat attendu

```text
Gestion des notifications
[Toutes] [Systeme] [Feedback (3)] [Utilisateur]

Onglet Feedback :
┌─────────────────────────────────────────┐
│ 🟠 En attente                           │
│ Bug sur la page projets                 │
│ par jean@mail.com · 28/03/2026          │
│ "Quand je clique sur..."               │
│                          [Repondre] [🗑] │
├─────────────────────────────────────────┤
│ ✅ Repondu                              │
│ Suggestion d'amelioration               │
│ par marie@mail.com · 25/03/2026         │
│  └─ Reponse de admin · 26/03 : "Merci" │
│                                    [🗑] │
└─────────────────────────────────────────┘

Onglet Systeme / Utilisateur :
Tableau classique avec badges colores
```

