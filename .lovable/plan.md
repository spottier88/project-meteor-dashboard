
# Plan d'implémentation : Mode lecture seule pour projets clôturés

## Objectif

Lorsqu'un projet est clôturé (`lifecycle_status === 'completed'`) :
1. Afficher un badge visuel "Projet clôturé" dans la vue de synthèse
2. Désactiver toutes les actions de modification (projet, tâches, risques, notes, équipe)
3. Ajouter un bouton "Réactiver le projet" visible uniquement pour les chefs de projet et administrateurs

---

## Architecture de la solution

La solution s'appuie sur le système de permissions existant en ajoutant une nouvelle propriété `isProjectClosed` qui sera propagée à tous les composants concernés.

### Stratégie choisie

Modifier le hook central `useProjectPermissions` pour :
- Ajouter une propriété `isProjectClosed` basée sur `lifecycle_status === 'completed'`
- Forcer toutes les permissions d'édition à `false` si le projet est clôturé (sauf pour réactiver)
- Ajouter une permission `canReactivateProject` pour le chef de projet et les admins

Cette approche centralisée garantit que tous les composants qui utilisent déjà les permissions seront automatiquement mis à jour.

---

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useProjectPermissions.tsx` | Ajouter `isProjectClosed`, `canReactivateProject` et logique de blocage |
| `src/hooks/use-task-permissions.tsx` | Prendre en compte `isProjectClosed` |
| `src/hooks/use-risk-access.tsx` | Prendre en compte `isProjectClosed` |
| `src/hooks/use-review-access.tsx` | Prendre en compte `isProjectClosed` |
| `src/components/project/ProjectSummaryContent.tsx` | Afficher le badge + bouton réactivation |
| `src/components/project/ProjectSummaryActions.tsx` | Masquer les actions si projet clôturé |
| `src/components/notes/ProjectNotesList.tsx` | Recevoir et utiliser `isProjectClosed` |

---

## Détails techniques

### 1. Création d'un nouveau composant badge

**Nouveau fichier : `src/components/project/ProjectClosedBadge.tsx`**

```typescript
/**
 * Badge indiquant qu'un projet est clôturé (terminé)
 * Affiche un état visuel clair pour signaler le mode lecture seule
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface ProjectClosedBadgeProps {
  className?: string;
}

export const ProjectClosedBadge = ({ className }: ProjectClosedBadgeProps) => {
  return (
    <Badge 
      variant="outline" 
      className={`border-green-500 text-green-700 bg-green-50 ${className || ''}`}
    >
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Projet clôturé
    </Badge>
  );
};
```

---

### 2. Création d'un bouton de réactivation

**Nouveau fichier : `src/components/project/ReactivateProjectButton.tsx`**

```typescript
/**
 * Bouton pour réactiver un projet clôturé
 * Visible uniquement pour les chefs de projet et administrateurs
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReactivateProjectButtonProps {
  projectId: string;
  onReactivated?: () => void;
}

export const ReactivateProjectButton = ({
  projectId,
  onReactivated,
}: ReactivateProjectButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReactivating, setIsReactivating] = useState(false);

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ lifecycle_status: "in_progress" })
        .eq("id", projectId);

      if (error) throw error;

      // Invalider les caches pour rafraîchir les données
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projectAccess"] });

      toast({
        title: "Projet réactivé",
        description: "Le projet est de nouveau en cours. Les modifications sont à nouveau possibles.",
      });

      onReactivated?.();
    } catch (error) {
      console.error("Erreur lors de la réactivation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de réactiver le projet.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isReactivating}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réactiver le projet
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Réactiver ce projet ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le projet passera au statut "En cours" et toutes les modifications
            seront à nouveau possibles (tâches, risques, notes, équipe).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleReactivate} disabled={isReactivating}>
            {isReactivating ? "Réactivation..." : "Réactiver"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

---

### 3. Modification de `src/hooks/useProjectPermissions.tsx`

Ajouter la détection du statut clôturé et forcer les permissions en lecture seule :

```typescript
// Ajouter dans la query projectAccess, récupérer lifecycle_status
const { data: project } = await supabase
  .from("projects")
  .select("project_manager, pole_id, direction_id, service_id, lifecycle_status")
  .eq("id", projectId)
  .single();

// Nouveau : vérifier si le projet est clôturé
const isProjectClosed = project?.lifecycle_status === 'completed';
```

Modifier les permissions retournées :

```typescript
// Forcer les permissions à false si projet clôturé
const effectiveCanEdit = isProjectClosed ? false : (isReadOnlyViaPortfolio ? false : (projectAccess?.canEdit || false));
const effectiveCanManageRisks = isProjectClosed ? false : (isReadOnlyViaPortfolio ? false : ...);
const effectiveCanManageTeam = isProjectClosed ? false : (isReadOnlyViaPortfolio ? false : ...);

// Permission de réactivation (seulement admin ou chef de projet)
const canReactivateProject = isProjectClosed && (isAdmin || projectAccess?.isProjectManager);

return {
  // ... permissions existantes modifiées
  isProjectClosed,
  canReactivateProject,
};
```

---

### 4. Modification des hooks de permissions spécifiques

**`src/hooks/use-task-permissions.tsx`** :

Ajouter une query pour récupérer le `lifecycle_status` et bloquer toutes les permissions si clôturé.

**`src/hooks/use-risk-access.tsx`** :

Même approche - bloquer `canCreateRisk`, `canEditRisk`, `canDeleteRisk` si projet clôturé.

**`src/hooks/use-review-access.tsx`** :

Bloquer `canCreateReview` et `canDeleteReview` si projet clôturé.

---

### 5. Modification de `src/components/project/ProjectSummaryContent.tsx`

Ajouter l'affichage du badge et du bouton de réactivation dans l'en-tête :

```typescript
// Import des nouveaux composants
import { ProjectClosedBadge } from "./ProjectClosedBadge";
import { ReactivateProjectButton } from "./ReactivateProjectButton";

// Dans le JSX, après le StatusIcon et le titre :
{permissions.isProjectClosed && (
  <ProjectClosedBadge />
)}

// Dans la zone des actions, ajouter le bouton de réactivation :
{permissions.canReactivateProject && (
  <ReactivateProjectButton 
    projectId={projectId}
    onReactivated={() => {
      // Rafraîchir la page ou les données
    }}
  />
)}
```

---

### 6. Modification de `src/components/project/ProjectSummaryActions.tsx`

Masquer les boutons d'action si le projet est clôturé :

```typescript
// Récupérer isProjectClosed depuis useProjectPermissions
const { canEdit, isProjectClosed } = useProjectPermissions(project?.id);

// Masquer les boutons Modifier et Nouvelle revue
{canEdit && !isProjectClosed && (
  // Bouton Modifier
)}

{canCreateReview && !isProjectClosed && (
  // Bouton Nouvelle revue
)}

// Dans le menu déroulant, masquer les actions de gestion
{hasManagementActions && !isProjectClosed && (
  // Menu de gestion (clôture, etc.)
)}
```

---

### 7. Modification de `src/components/notes/ProjectNotesList.tsx`

Recevoir `isProjectClosed` en prop et bloquer les actions :

```typescript
interface ProjectNotesListProps {
  projectId: string;
  canEdit: boolean;
  isAdmin: boolean;
  isProjectClosed?: boolean; // Nouvelle prop
}

// Dans le composant, forcer canEdit à false si clôturé
const effectiveCanEdit = isProjectClosed ? false : canEdit;
```

---

### 8. Mise à jour des props dans `ProjectSummaryContent.tsx`

Passer `isProjectClosed` aux composants enfants :

```typescript
<TaskList 
  projectId={projectId}
  canEdit={permissions.canEdit}
  isProjectManager={permissions.isProjectManager}
  isAdmin={permissions.isAdmin}
  preloadedTasks={tasks}
  isProjectClosed={permissions.isProjectClosed}
/>

<RiskList 
  projectId={projectId}
  projectTitle={project.title}
  canEdit={permissions.canEdit}
  isProjectManager={permissions.isProjectManager}
  isAdmin={permissions.isAdmin}
  preloadedRisks={risks}
  isProjectClosed={permissions.isProjectClosed}
/>

<ProjectNotesList
  projectId={projectId}
  canEdit={permissions.canEdit}
  isAdmin={permissions.isAdmin}
  isProjectClosed={permissions.isProjectClosed}
/>

<TeamManagement
  projectId={projectId}
  permissions={{
    ...permissions,
    canManageTeam: permissions.isProjectClosed ? false : permissions.canManageTeam
  }}
  preloadedData={teamManagement}
/>
```

---

## Résumé des fichiers à créer/modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/project/ProjectClosedBadge.tsx` | Créer | Badge visuel "Projet clôturé" |
| `src/components/project/ReactivateProjectButton.tsx` | Créer | Bouton de réactivation avec confirmation |
| `src/hooks/useProjectPermissions.tsx` | Modifier | Ajouter `isProjectClosed`, `canReactivateProject` |
| `src/hooks/use-task-permissions.tsx` | Modifier | Bloquer si projet clôturé |
| `src/hooks/use-risk-access.tsx` | Modifier | Bloquer si projet clôturé |
| `src/hooks/use-review-access.tsx` | Modifier | Bloquer si projet clôturé |
| `src/components/project/ProjectSummaryContent.tsx` | Modifier | Afficher badge + bouton réactivation + passer props |
| `src/components/project/ProjectSummaryActions.tsx` | Modifier | Masquer actions si clôturé |
| `src/components/TaskList.tsx` | Modifier | Accepter prop `isProjectClosed` |
| `src/components/RiskList.tsx` | Modifier | Accepter prop `isProjectClosed` |
| `src/components/notes/ProjectNotesList.tsx` | Modifier | Accepter prop `isProjectClosed` |

---

## Flux visuel après implémentation

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Projet clôturé (completed)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Badge "Projet clôturé" vert  │
              │  affiché à côté du titre      │
              └───────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
   ┌─────────────────┐               ┌─────────────────────┐
   │ Chef de projet  │               │ Autres utilisateurs │
   │ / Admin         │               │ (membres, viewers)  │
   └─────────────────┘               └─────────────────────┘
            │                                   │
            ▼                                   ▼
   ┌─────────────────┐               ┌─────────────────────┐
   │ Bouton          │               │ Lecture seule       │
   │ "Réactiver"     │               │ (aucune action)     │
   │ visible         │               └─────────────────────┘
   └─────────────────┘
            │
            ▼ (clic)
   ┌─────────────────┐
   │ Confirmation    │
   │ → Status        │
   │   "En cours"    │
   └─────────────────┘
```

---

## Comportement détaillé par zone

| Zone | Projet actif | Projet clôturé (non-admin) | Projet clôturé (admin/CDP) |
|------|--------------|----------------------------|----------------------------|
| Bouton Modifier | ✅ Visible | ❌ Masqué | ❌ Masqué |
| Bouton Nouvelle revue | ✅ Visible | ❌ Masqué | ❌ Masqué |
| Bouton Clôturer | ✅ Visible | ❌ Masqué | ❌ Masqué |
| Bouton Réactiver | ❌ Masqué | ❌ Masqué | ✅ Visible |
| Ajout tâche | ✅ Possible | ❌ Masqué | ❌ Masqué |
| Édition tâche | ✅ Possible | ❌ Désactivé | ❌ Désactivé |
| Ajout risque | ✅ Possible | ❌ Masqué | ❌ Masqué |
| Ajout note | ✅ Possible | ❌ Masqué | ❌ Masqué |
| Gestion équipe | ✅ Possible | ❌ Masqué | ❌ Masqué |
| Badge "Clôturé" | ❌ Masqué | ✅ Visible | ✅ Visible |

---

## Avantages de cette solution

1. **Centralisée** : La logique de blocage est dans `useProjectPermissions`, évitant la duplication
2. **Rétrocompatible** : Les composants existants continuent de fonctionner
3. **Progressive** : Les hooks spécifiques (tâches, risques, revues) héritent du blocage
4. **Sécurisée** : Même si un composant oublie de vérifier, le hook de permissions bloque
5. **Réversible** : Le chef de projet peut réactiver le projet à tout moment
