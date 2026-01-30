
# Plan d'implémentation : Permettre la saisie de l'évaluation reportée

## Problème identifié

Lorsqu'un utilisateur reporte l'évaluation lors de la clôture d'un projet :
- Le projet passe au statut `lifecycle_status = 'completed'` et `closure_status = 'pending_evaluation'`
- Comme `lifecycle_status === 'completed'`, le système considère le projet comme "clôturé" (`isProjectClosed = true`)
- Le composant `ProjectSummaryActions` est masqué pour les projets clôturés
- **Résultat** : Le bouton "Compléter l'évaluation" et le badge "Évaluation en attente" ne sont jamais affichés

---

## Architecture de la solution

### Approche retenue : Créer un bouton dédié pour compléter l'évaluation

Plutôt que de modifier la logique complexe de masquage de `ProjectSummaryActions`, créer un **nouveau composant** `CompleteEvaluationButton` qui sera affiché dans l'en-tête du projet spécifiquement pour les projets avec évaluation en attente.

Cette approche :
- Ne modifie pas la logique de masquage existante pour les projets clôturés
- Rend le bouton bien visible dans l'en-tête (pas caché dans un menu)
- Est cohérente avec le bouton `ReactivateProjectButton` qui s'affiche aussi à côté du badge

---

## Fichiers à créer

### 1. Nouveau composant : `src/components/project/CompleteEvaluationButton.tsx`

```typescript
/**
 * Bouton pour compléter l'évaluation d'un projet clôturé
 * S'affiche uniquement pour les projets avec closure_status = 'pending_evaluation'
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileCheck } from "lucide-react";
import { ProjectClosureDialog } from "./closure/ProjectClosureDialog";

interface CompleteEvaluationButtonProps {
  projectId: string;
  projectTitle: string;
  onComplete?: () => void;
}

export const CompleteEvaluationButton = ({
  projectId,
  projectTitle,
  onComplete,
}: CompleteEvaluationButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="text-orange-600 border-orange-300 hover:bg-orange-50"
      >
        <FileCheck className="h-4 w-4 mr-2" />
        Compléter l'évaluation
      </Button>

      <ProjectClosureDialog
        projectId={projectId}
        projectTitle={projectTitle}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onClosureComplete={onComplete}
        pendingEvaluationMode={true}
      />
    </>
  );
};
```

---

## Fichiers à modifier

### 2. Modifier `src/hooks/useProjectPermissions.tsx`

Ajouter une nouvelle propriété `hasPendingEvaluation` pour détecter les projets avec évaluation en attente.

**Modifications :**

1. Récupérer `closure_status` dans la query (en plus de `lifecycle_status`)

2. Ajouter une nouvelle variable pour déterminer si une évaluation est en attente :

```typescript
// Déterminer si le projet a une évaluation en attente
const hasPendingEvaluation = projectAccess?.lifecycleStatus === 'completed' 
  && projectAccess?.closureStatus === 'pending_evaluation';
```

3. Ajouter une permission pour compléter l'évaluation :

```typescript
// Permission de compléter l'évaluation : si évaluation en attente ET (admin OU chef de projet)
const canCompleteEvaluation = hasPendingEvaluation 
  && (isAdmin || projectAccess?.isProjectManager);
```

4. Retourner les nouvelles propriétés :

```typescript
return {
  // ... propriétés existantes
  hasPendingEvaluation,
  canCompleteEvaluation,
};
```

---

### 3. Modifier `src/components/project/ProjectSummaryContent.tsx`

Afficher le badge "Évaluation en attente" et le bouton "Compléter l'évaluation" dans l'en-tête.

**Modifications :**

1. Importer les nouveaux composants :

```typescript
import { ClosurePendingBadge } from "./ClosurePendingBadge";
import { CompleteEvaluationButton } from "./CompleteEvaluationButton";
```

2. Mettre à jour l'interface des permissions :

```typescript
permissions: {
  // ... propriétés existantes
  hasPendingEvaluation?: boolean;
  canCompleteEvaluation?: boolean;
};
```

3. Dans le JSX, après le badge "Projet clôturé", ajouter le badge "Évaluation en attente" :

```tsx
{/* Badge projet clôturé */}
{permissions.isProjectClosed && !permissions.hasPendingEvaluation && (
  <ProjectClosedBadge />
)}

{/* Badge évaluation en attente (différent de clôturé complet) */}
{permissions.hasPendingEvaluation && (
  <ClosurePendingBadge />
)}
```

4. Dans la zone des boutons, ajouter le bouton "Compléter l'évaluation" :

```tsx
{/* Bouton de réactivation pour admin/chef de projet si projet clôturé */}
{permissions.canReactivateProject && (
  <ReactivateProjectButton ... />
)}

{/* Bouton pour compléter l'évaluation en attente */}
{permissions.canCompleteEvaluation && (
  <CompleteEvaluationButton 
    projectId={projectId}
    projectTitle={project.title}
    onComplete={onClosureComplete}
  />
)}
```

---

## Résumé des modifications

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/project/CompleteEvaluationButton.tsx` | Créer | Bouton pour ouvrir le dialogue d'évaluation |
| `src/hooks/useProjectPermissions.tsx` | Modifier | Ajouter `hasPendingEvaluation`, `canCompleteEvaluation`, récupérer `closure_status` |
| `src/components/project/ProjectSummaryContent.tsx` | Modifier | Afficher badge + bouton pour évaluation en attente |

---

## Logique de décision pour les badges et boutons

| État du projet | Badge affiché | Bouton visible |
|----------------|---------------|----------------|
| En cours (`lifecycle_status != completed`) | Aucun | Actions normales |
| Clôturé avec évaluation (`closure_status = completed`) | "Projet clôturé" (vert) | "Réactiver" (admin/CDP) |
| Clôturé sans évaluation (`closure_status = pending_evaluation`) | "Évaluation en attente" (orange) | "Compléter l'évaluation" + "Réactiver" (admin/CDP) |

---

## Flux visuel après implémentation

```text
┌─────────────────────────────────────────────────────────────────┐
│  Projet avec évaluation en attente                              │
│  (lifecycle_status = completed, closure_status = pending_eval)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  En-tête du projet                                     │
     │  ┌───────────────────────┐                             │
     │  │ Titre │ Badge orange  │  [Compléter] [Réactiver]    │
     │  │       │ "Évaluation   │                             │
     │  │       │ en attente"   │                             │
     │  └───────────────────────┘                             │
     └────────────────────────────────────────────────────────┘
                              │
                              │ Clic sur "Compléter l'évaluation"
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  Dialogue ProjectClosureDialog                         │
     │  (mode pendingEvaluationMode = true)                   │
     │                                                         │
     │  → Affiche directement l'étape d'évaluation            │
     │    de méthode (4 champs texte)                         │
     │                                                         │
     │  [Retour]              [Continuer]                      │
     └────────────────────────────────────────────────────────┘
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  Confirmation et enregistrement                        │
     │  closure_status → 'completed'                          │
     └────────────────────────────────────────────────────────┘
```

---

## Avantages de cette solution

1. **Visible** : Le bouton "Compléter l'évaluation" est dans l'en-tête, pas caché dans un menu
2. **Cohérent** : Suit le même pattern que `ReactivateProjectButton`
3. **Minimal** : Ne modifie pas la logique de masquage de `ProjectSummaryActions`
4. **Réutilisable** : Le dialogue existant est réutilisé avec son mode `pendingEvaluationMode`
5. **Sécurisé** : Respecte les permissions (seuls admin/chef de projet peuvent compléter)

---

## Tests recommandés

1. **Clôturer un projet avec report d'évaluation**
   - Vérifier que le badge orange "Évaluation en attente" apparaît
   - Vérifier que le bouton "Compléter l'évaluation" apparaît (pour admin/CDP)
   - Vérifier que le badge vert "Projet clôturé" n'apparaît PAS

2. **Compléter l'évaluation en attente**
   - Cliquer sur "Compléter l'évaluation"
   - Vérifier que le dialogue s'ouvre directement sur l'étape d'évaluation
   - Remplir et valider
   - Vérifier que le badge passe au vert "Projet clôturé"

3. **Projet complètement clôturé**
   - Vérifier que seul le badge vert apparaît
   - Vérifier que le bouton "Compléter l'évaluation" n'apparaît PAS
