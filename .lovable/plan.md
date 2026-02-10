

# Plan d'implémentation : Notifications de revue de portefeuille

## Besoin 1 : Inclure les chefs de projet secondaires comme destinataires

### Problème actuel

Le dialog `PortfolioReviewNotificationDialog.tsx` ne récupère que les chefs de projet principaux (`project_manager_id`) des projets du portefeuille. Les chefs de projet secondaires (rôle `secondary_manager` dans la table `project_members`) sont ignorés.

### Modifications à effectuer

#### 1.1 Modifier la requête de récupération des destinataires

**Fichier** : `src/components/portfolio/PortfolioReviewNotificationDialog.tsx`

Dans la query `portfolio-project-managers` (lignes 141-184), ajouter la récupération des chefs de projet secondaires :

```typescript
queryFn: async () => {
  // 1. Récupérer les projets du portefeuille
  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, title, project_manager_id, project_manager")
    .in("id", projects.map((p) => p.id));

  // 2. Récupérer les CDP secondaires via project_members
  const { data: secondaryManagers } = await supabase
    .from("project_members")
    .select("user_id, project_id")
    .in("project_id", projects.map((p) => p.id))
    .eq("role", "secondary_manager");

  // 3. Collecter TOUS les IDs uniques (principaux + secondaires)
  const allManagerIds = new Set<string>();
  projectsData?.forEach(p => { if (p.project_manager_id) allManagerIds.add(p.project_manager_id); });
  secondaryManagers?.forEach(sm => { if (sm.user_id) allManagerIds.add(sm.user_id); });

  // 4. Récupérer les profils une seule fois (dédupliqué par Set)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .in("id", [...allManagerIds]);

  // 5. Construire le mapping manager -> projets (principal + secondaire)
  // Un manager voit les projets dont il est CDP principal OU secondaire
  const managerProjectsMap = new Map<string, string[]>();
  projectsData?.forEach(project => {
    if (project.project_manager_id) {
      const existing = managerProjectsMap.get(project.project_manager_id) || [];
      existing.push(project.title);
      managerProjectsMap.set(project.project_manager_id, existing);
    }
  });
  secondaryManagers?.forEach(sm => {
    if (sm.user_id) {
      const projectTitle = projectsData?.find(p => p.id === sm.project_id)?.title;
      if (projectTitle) {
        const existing = managerProjectsMap.get(sm.user_id) || [];
        if (!existing.includes(projectTitle)) existing.push(projectTitle);
        managerProjectsMap.set(sm.user_id, existing);
      }
    }
  });

  // 6. Construire la liste finale (déjà dédupliquée via le Set)
  return (profiles || []).map(profile => ({
    id: profile.id,
    email: profile.email || "",
    first_name: profile.first_name,
    last_name: profile.last_name,
    projectTitles: managerProjectsMap.get(profile.id) || [],
  }));
}
```

**Resultat** : Le `Set` garantit qu'un utilisateur qui est CDP principal d'un projet ET secondaire d'un autre n'apparait qu'une seule fois dans la liste des destinataires.

#### 1.2 Modifier le hook d'envoi des notifications

**Fichier** : `src/hooks/usePortfolioReviews.ts`

Dans `useSendReviewNotifications`, adapter la requête qui mappe les managers aux projets (lignes 248-265) pour aussi inclure les projets dont le manager est CDP secondaire :

```typescript
// Récupérer aussi les liens CDP secondaire
const { data: secondaryLinks } = await supabase
  .from("project_members")
  .select("user_id, project_id")
  .in("project_id", portfolioProjectIds)
  .in("user_id", projectManagerIds)
  .eq("role", "secondary_manager");

// Enrichir le mapping avec les projets secondaires
secondaryLinks?.forEach(link => {
  if (link.user_id) {
    const projectTitle = projects?.find(p => p.id === link.project_id)?.title;
    if (projectTitle) {
      const existing = managerProjectsMap.get(link.user_id) || [];
      if (!existing.includes(projectTitle)) existing.push(projectTitle);
      managerProjectsMap.set(link.user_id, existing);
    }
  }
});
```

Ainsi, l'email envoyé au CDP secondaire listera bien les projets concernés.

#### 1.3 Optionnel : indicateur visuel du rôle

Dans la liste des destinataires du dialog, afficher une mention "(secondaire)" à côté des projets gérés en tant que CDP secondaire, pour que l'expéditeur sache qui est CDP principal et qui est secondaire.

---

## Besoin 2 : Suivi des envois de notifications

### Situation actuelle

La table `portfolio_review_notifications` enregistre déjà chaque envoi avec :
- `sent_at` (date d'envoi)
- `sent_by` (expéditeur)
- `recipient_count` (nombre de destinataires)
- `message` (message personnalisé)
- `email_template_id` (template utilisé)

Mais ces données **ne sont pas affichées** dans l'interface.

### Modifications à effectuer

#### 2.1 Créer un composant d'historique des notifications

**Nouveau fichier** : `src/components/portfolio/PortfolioReviewNotificationHistory.tsx`

Affiche l'historique des envois pour une revue donnée :

```text
┌──────────────────────────────────────────────────────────┐
│  Historique des envois                                    │
├──────────────────────────────────────────────────────────┤
│  📧 12/02/2026 à 14:32 - par Jean Dupont                │
│     3 destinataire(s) - Modèle: "Notification revue"    │
│     Message: "Merci de mettre à jour vos projets..."    │
├──────────────────────────────────────────────────────────┤
│  📧 05/02/2026 à 09:15 - par Marie Martin               │
│     3 destinataire(s) - Modèle: "Notification revue"    │
└──────────────────────────────────────────────────────────┘
```

#### 2.2 Ajouter un hook de récupération de l'historique

**Fichier** : `src/hooks/usePortfolioReviews.ts`

Ajouter un hook `useReviewNotificationHistory` :

```typescript
export const useReviewNotificationHistory = (reviewId: string) => {
  return useQuery({
    queryKey: ["portfolio-review-notifications", reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_review_notifications")
        .select(`
          *,
          profiles:sent_by (first_name, last_name, email),
          email_templates:email_template_id (name)
        `)
        .eq("portfolio_review_id", reviewId)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!reviewId,
  });
};
```

#### 2.3 Intégrer l'historique dans la liste des revues

**Fichier** : `src/components/portfolio/PortfolioReviewList.tsx`

Ajouter un bouton ou une section dépliable sous chaque revue pour afficher l'historique :

- Ajouter une icône "Historique" (ex: `Clock` ou `History` de lucide-react)
- Au clic, afficher/masquer le composant `PortfolioReviewNotificationHistory`
- Ou bien : afficher un badge avec le nombre d'envois, et un Collapsible pour le détail

#### 2.4 Enrichir les données de suivi (optionnel)

Pour un suivi plus détaillé, on pourrait aussi stocker les **destinataires individuels** de chaque envoi. Cela nécessiterait :

**Nouvelle table** : `portfolio_review_notification_recipients`

```sql
CREATE TABLE portfolio_review_notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES portfolio_review_notifications(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id),
  recipient_email text NOT NULL,
  recipient_name text,
  project_titles text[],
  created_at timestamptz DEFAULT now()
);
```

Et dans `usePortfolioReviews.ts`, lors de l'envoi, insérer une ligne par destinataire.

Cela permettrait d'afficher : "Envoyé à Jean Dupont (Projet A, B), Marie Martin (Projet C)".

---

## Résumé des fichiers à créer/modifier

| Action | Fichier | Description |
|--------|---------|-------------|
| Modifier | `src/components/portfolio/PortfolioReviewNotificationDialog.tsx` | Ajouter CDP secondaires dans la liste des destinataires |
| Modifier | `src/hooks/usePortfolioReviews.ts` | Ajouter projets secondaires au mapping + hook historique |
| Créer | `src/components/portfolio/PortfolioReviewNotificationHistory.tsx` | Composant d'affichage de l'historique des envois |
| Modifier | `src/components/portfolio/PortfolioReviewList.tsx` | Intégrer l'historique dans la liste des revues |
| Migration | SQL (optionnel) | Table `portfolio_review_notification_recipients` pour suivi détaillé |

---

## Tests recommandés

1. **CDP secondaires comme destinataires**
   - Ajouter un CDP secondaire à un projet du portefeuille
   - Ouvrir le dialog de notification : vérifier qu'il apparait dans la liste
   - Vérifier qu'un utilisateur CDP principal d'un projet ET secondaire d'un autre n'apparait qu'une seule fois
   - Envoyer la notification et vérifier la réception

2. **Historique des envois**
   - Envoyer plusieurs notifications pour une même revue
   - Vérifier que chaque envoi est listé avec date, expéditeur et nombre de destinataires
   - Vérifier l'affichage du nom du template utilisé

