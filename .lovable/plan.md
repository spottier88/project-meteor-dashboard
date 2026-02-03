
# Plan d'implémentation : Scénario 5 Hybride avec nouveau rôle "Responsable Qualité"

## Résumé de la modification demandée

Remplacer l'accès administrateur pour la consultation des évaluations de tous les projets par un **nouveau rôle utilisateur dédié**, permettant à des utilisateurs non-admin d'accéder à l'analyse transversale des évaluations.

---

## Proposition de nom pour le nouveau rôle

| Option | Nom technique | Libellé français | Description |
|--------|---------------|------------------|-------------|
| A | `quality_manager` | Responsable Qualité | Focus sur l'amélioration continue |
| B | `evaluation_viewer` | Lecteur Évaluations | Descriptif mais limité |
| C | `rex_manager` | Responsable REX | Retour d'Expérience (terme PMO) |

**Recommandation** : `quality_manager` (Responsable Qualité) - plus générique et potentiellement extensible à d'autres fonctionnalités qualité.

---

## Architecture de la solution

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Nouveau rôle : quality_manager               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────────┐                 ┌───────────────────────┐
│ Accès page dédiée     │                 │ Accès onglet "Bilan"  │
│ /evaluations          │                 │ dans ProjectSummary   │
│ (vue transversale)    │                 │ (projets clôturés)    │
└───────────────────────┘                 └───────────────────────┘
        │                                           │
        ▼                                           ▼
┌───────────────────────┐                 ┌───────────────────────┐
│ - Liste toutes les    │                 │ - Visible par CDP,    │
│   évaluations         │                 │   admin, manager org  │
│ - Filtres par pôle,   │                 │   ET quality_manager  │
│   direction, période  │                 │ - Lecture seule       │
│ - Export Excel        │                 └───────────────────────┘
│ - Statistiques        │
└───────────────────────┘
```

---

## Modifications à effectuer

### Phase 1 : Création du nouveau rôle

#### 1.1 Mise à jour du type `UserRole`

**Fichier** : `src/types/user.ts`

```typescript
// Avant
export type UserRole = "admin" | "chef_projet" | "manager" | "membre" | "time_tracker" | "portfolio_manager";

// Après
export type UserRole = "admin" | "chef_projet" | "manager" | "membre" | "time_tracker" | "portfolio_manager" | "quality_manager";
```

#### 1.2 Mise à jour de l'enum côté base de données

**Migration SQL à exécuter** :

```sql
-- Ajouter la nouvelle valeur à l'enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'quality_manager';
```

#### 1.3 Mise à jour du contexte de permissions

**Fichier** : `src/contexts/PermissionsContext.tsx`

Ajouter dans l'interface `PermissionsState` :
```typescript
isQualityManager: boolean;
```

Ajouter le calcul :
```typescript
const isQualityManager = hasRole('quality_manager');
```

Et l'exposer dans le provider.

#### 1.4 Mise à jour des formulaires utilisateur

**Fichier** : `src/components/form/UserFormFields.tsx`

Ajouter une checkbox pour le rôle `quality_manager` :
```tsx
<Checkbox
  id="quality_manager"
  checked={roles.includes("quality_manager")}
  onCheckedChange={() => handleRoleToggle("quality_manager")}
/>
<Label htmlFor="quality_manager">Responsable Qualité</Label>
```

**Fichier** : `src/components/admin/InviteUserForm.tsx`

Ajouter dans le Select :
```tsx
<SelectItem value="quality_manager">Responsable Qualité</SelectItem>
```

**Fichiers** : `src/pages/UserManagement.tsx`, `src/components/profile/ProfileForm.tsx`, `src/components/feedback/FeedbackForm.tsx`

Ajouter le libellé dans les fonctions de mapping :
```typescript
case "quality_manager":
  return "Responsable Qualité";
```

---

### Phase 2 : Onglet "Bilan" dans ProjectSummary

#### 2.1 Créer le composant d'affichage de l'évaluation

**Nouveau fichier** : `src/components/project/ProjectEvaluationTab.tsx`

```typescript
interface ProjectEvaluationTabProps {
  projectId: string;
}

// Affiche les 4 sections de l'évaluation en lecture seule :
// - Ce qui a fonctionné
// - Ce qui a manqué
// - Améliorations proposées
// - Leçons apprises
```

#### 2.2 Créer le hook de récupération des évaluations

**Nouveau fichier** : `src/hooks/useProjectEvaluation.ts`

```typescript
export const useProjectEvaluation = (projectId: string) => {
  return useQuery({
    queryKey: ["project-evaluation", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_evaluations")
        .select("*")
        .eq("project_id", projectId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!projectId,
  });
};
```

#### 2.3 Intégrer l'onglet dans ProjectSummaryContent

**Fichier** : `src/components/project/ProjectSummaryContent.tsx`

Ajouter l'onglet "Bilan" visible uniquement pour les projets clôturés :
```tsx
{isProjectClosed && (
  <TabsTrigger value="evaluation">
    <ClipboardCheck className="h-4 w-4 mr-2" />
    Bilan
  </TabsTrigger>
)}

<TabsContent value="evaluation">
  <ProjectEvaluationTab projectId={projectId} />
</TabsContent>
```

---

### Phase 3 : Page dédiée aux évaluations

#### 3.1 Créer la page principale

**Nouveau fichier** : `src/pages/EvaluationsManagement.tsx`

Structure :
- En-tête avec titre "Retours d'Expérience"
- Filtres : Pôle, Direction, Service, Période, Recherche
- Tableau des évaluations avec colonnes :
  - Projet (lien)
  - Chef de projet
  - Date de clôture
  - Organisation (Pôle/Direction/Service)
  - Actions (Voir détails)
- Bouton d'export Excel
- Statistiques globales (optionnel)

#### 3.2 Créer le hook de récupération des évaluations

**Nouveau fichier** : `src/hooks/useAllEvaluations.ts`

```typescript
interface EvaluationFilters {
  poleId?: string;
  directionId?: string;
  serviceId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export const useAllEvaluations = (filters: EvaluationFilters) => {
  return useQuery({
    queryKey: ["all-evaluations", filters],
    queryFn: async () => {
      let query = supabase
        .from("project_evaluations")
        .select(`
          *,
          projects:project_id (
            id,
            title,
            project_manager,
            pole_id,
            direction_id,
            service_id,
            end_date,
            poles:pole_id (name),
            directions:direction_id (name),
            services:service_id (name)
          )
        `);
      
      // Appliquer les filtres...
      
      return data;
    },
  });
};
```

#### 3.3 Créer le composant de dialogue de détails

**Nouveau fichier** : `src/components/evaluations/EvaluationDetailsDialog.tsx`

Affiche le détail complet d'une évaluation dans une modale :
- Informations du projet
- Les 4 sections de l'évaluation
- Date de création

#### 3.4 Créer l'utilitaire d'export Excel

**Nouveau fichier** : `src/utils/evaluationsExport.ts`

```typescript
export const exportEvaluationsToExcel = async (evaluations: Evaluation[]) => {
  // Utilise la bibliothèque xlsx déjà installée
  // Format : 1 ligne par évaluation avec toutes les colonnes
};
```

#### 3.5 Ajouter la route

**Fichier** : `src/routes.tsx`

```tsx
<Route
  path="/evaluations"
  element={
    <ProtectedRoute>
      <EvaluationsManagement />
    </ProtectedRoute>
  }
/>
```

#### 3.6 Ajouter le lien dans le Dashboard

**Fichier** : `src/components/dashboard/QuickActions.tsx`

Ajouter un bouton visible pour `admin` OU `quality_manager` :
```tsx
const canViewAllEvaluations = isAdmin || hasRole('quality_manager');

{canViewAllEvaluations && (
  <Button onClick={() => navigate("/evaluations")}>
    <ClipboardCheck className="mr-2 h-4 w-4" />
    Retours d'expérience
  </Button>
)}
```

---

### Phase 4 : Politiques RLS

#### 4.1 Créer une fonction SQL pour vérifier le rôle quality_manager

```sql
CREATE OR REPLACE FUNCTION public.is_quality_manager(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'quality_manager'
  )
$$;
```

#### 4.2 Mettre à jour les politiques RLS sur `project_evaluations`

```sql
-- Politique de lecture étendue
CREATE POLICY "quality_managers_can_read_all_evaluations"
ON public.project_evaluations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_quality_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_evaluations.project_id
    AND (
      p.owner_id = auth.uid()
      OR p.project_manager = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  )
);
```

---

## Résumé des fichiers à créer/modifier

| Action | Fichier | Description |
|--------|---------|-------------|
| Modifier | `src/types/user.ts` | Ajouter `quality_manager` au type |
| Modifier | `src/contexts/PermissionsContext.tsx` | Ajouter `isQualityManager` |
| Modifier | `src/components/form/UserFormFields.tsx` | Ajouter checkbox rôle |
| Modifier | `src/components/admin/InviteUserForm.tsx` | Ajouter option invitation |
| Modifier | `src/pages/UserManagement.tsx` | Ajouter libellé rôle |
| Modifier | `src/components/profile/ProfileForm.tsx` | Ajouter libellé rôle |
| Modifier | `src/components/feedback/FeedbackForm.tsx` | Ajouter libellé rôle |
| Créer | `src/hooks/useProjectEvaluation.ts` | Hook récupération évaluation |
| Créer | `src/components/project/ProjectEvaluationTab.tsx` | Onglet Bilan |
| Modifier | `src/components/project/ProjectSummaryContent.tsx` | Intégrer onglet |
| Créer | `src/hooks/useAllEvaluations.ts` | Hook toutes évaluations |
| Créer | `src/pages/EvaluationsManagement.tsx` | Page principale |
| Créer | `src/components/evaluations/EvaluationDetailsDialog.tsx` | Dialogue détails |
| Créer | `src/utils/evaluationsExport.ts` | Export Excel |
| Modifier | `src/routes.tsx` | Ajouter route /evaluations |
| Modifier | `src/components/dashboard/QuickActions.tsx` | Ajouter bouton accès |
| Migration | SQL | Ajouter enum + politiques RLS |

---

## Matrice des accès

| Fonctionnalité | Admin | Quality Manager | Chef de projet | Manager | Membre |
|----------------|-------|-----------------|----------------|---------|--------|
| Onglet "Bilan" (son projet) | Oui | Oui | Oui | Oui (si manager org) | Non |
| Page /evaluations | Oui | Oui | Non | Non | Non |
| Export Excel évaluations | Oui | Oui | Non | Non | Non |
| Statistiques transversales | Oui | Oui | Non | Non | Non |

---

## Estimation

| Phase | Durée estimée |
|-------|---------------|
| Phase 1 : Nouveau rôle | 1-2h |
| Phase 2 : Onglet Bilan | 2-3h |
| Phase 3 : Page dédiée | 4-5h |
| Phase 4 : Politiques RLS | 1h |
| **Total** | **8-11h** |

---

## Tests recommandés

1. **Création du rôle**
   - Assigner le rôle `quality_manager` à un utilisateur non-admin
   - Vérifier qu'il voit le bouton "Retours d'expérience" sur le dashboard

2. **Page des évaluations**
   - Accéder à `/evaluations` avec un `quality_manager`
   - Vérifier que toutes les évaluations sont listées
   - Tester les filtres et l'export Excel

3. **Onglet Bilan**
   - Naviguer vers un projet clôturé
   - Vérifier que l'onglet "Bilan" est visible
   - Vérifier l'affichage des 4 sections de l'évaluation

4. **Sécurité**
   - Tenter d'accéder à `/evaluations` sans le rôle approprié
   - Vérifier que l'accès est refusé
