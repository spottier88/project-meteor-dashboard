
# Plan d'implémentation : Réactivation et nouvelle clôture de projet

## Contexte du problème

Lorsqu'un projet est clôturé, des données sont créées dans :
1. **Table `reviews`** : Une revue finale avec `is_final_review = true`
2. **Table `project_evaluations`** : Une évaluation de méthode (avec contrainte `UNIQUE(project_id)`)

Si l'utilisateur réactive le projet (modifie manuellement le `lifecycle_status`), il ne peut pas relancer le processus de clôture car :
- L'insertion d'une nouvelle évaluation échoue (contrainte d'unicité)
- Les anciennes données de clôture restent en base

## Solution proposée

Ajouter une étape de vérification au début du processus de clôture qui :
1. Détecte si des données de clôture existent déjà
2. Propose à l'utilisateur de supprimer ces anciennes données
3. Permet ensuite de créer une nouvelle clôture complète

---

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useProjectClosure.ts` | Ajouter la logique de détection et suppression des données existantes |
| `src/components/project/closure/ProjectClosureDialog.tsx` | Afficher un message d'avertissement et options de suppression |
| `src/components/project/closure/ClosureStepIntro.tsx` | Adapter l'interface pour gérer le cas "données existantes" |

---

## Détails techniques

### 1. Modification de `src/hooks/useProjectClosure.ts`

Ajouter de nouvelles fonctionnalités au hook :

#### A. Nouveau state pour gérer les données existantes

```typescript
interface ExistingClosureData {
  hasFinalReview: boolean;
  hasEvaluation: boolean;
  finalReviewId?: string;
  evaluationId?: string;
}
```

Ajouter au state :
```typescript
const [existingData, setExistingData] = useState<ExistingClosureData | null>(null);
const [checkingExistingData, setCheckingExistingData] = useState(false);
```

#### B. Fonction pour vérifier les données existantes

```typescript
const checkExistingClosureData = async () => {
  setCheckingExistingData(true);
  try {
    // Vérifier si une revue finale existe
    const { data: finalReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_final_review', true)
      .maybeSingle();

    // Vérifier si une évaluation existe
    const { data: evaluation } = await supabase
      .from('project_evaluations')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    setExistingData({
      hasFinalReview: !!finalReview,
      hasEvaluation: !!evaluation,
      finalReviewId: finalReview?.id,
      evaluationId: evaluation?.id,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification des données existantes:", error);
  } finally {
    setCheckingExistingData(false);
  }
};
```

#### C. Fonction pour supprimer les données existantes

```typescript
const deleteExistingClosureData = async () => {
  if (!existingData) return false;

  try {
    // Supprimer l'évaluation existante si présente
    if (existingData.evaluationId) {
      const { error: evalError } = await supabase
        .from('project_evaluations')
        .delete()
        .eq('id', existingData.evaluationId);
      
      if (evalError) throw evalError;
    }

    // Supprimer la revue finale existante si présente
    if (existingData.finalReviewId) {
      const { error: reviewError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', existingData.finalReviewId);
      
      if (reviewError) throw reviewError;
    }

    // Réinitialiser les champs de clôture du projet
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        closure_status: null,
        closed_at: null,
        closed_by: null,
      })
      .eq('id', projectId);

    if (projectError) throw projectError;

    // Invalider les caches
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projectEvaluation", projectId] });
    queryClient.invalidateQueries({ queryKey: ["lastReviews", projectId] });

    // Réinitialiser le state des données existantes
    setExistingData(null);

    toast({
      title: "Données supprimées",
      description: "Les anciennes données de clôture ont été supprimées.",
    });

    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    toast({
      title: "Erreur",
      description: "Impossible de supprimer les anciennes données.",
      variant: "destructive",
    });
    return false;
  }
};
```

#### D. Retourner les nouvelles fonctions

Ajouter au return du hook :
```typescript
return {
  // ... existant
  existingData,
  checkingExistingData,
  checkExistingClosureData,
  deleteExistingClosureData,
};
```

---

### 2. Modification de `src/components/project/closure/ProjectClosureDialog.tsx`

#### A. Appeler la vérification à l'ouverture

Modifier le `useEffect` existant :
```typescript
useEffect(() => {
  if (isOpen) {
    resetClosure();
    if (pendingEvaluationMode) {
      goToStep('method_evaluation');
    } else {
      // Vérifier si des données existantes existent
      checkExistingClosureData();
    }
  }
}, [isOpen, resetClosure, pendingEvaluationMode, goToStep, checkExistingClosureData]);
```

#### B. Passer les props au composant ClosureStepIntro

```typescript
case 'intro':
  return (
    <ClosureStepIntro
      projectTitle={projectTitle}
      onContinue={goToNextStep}
      onCancel={handleClose}
      existingData={existingData}
      checkingExistingData={checkingExistingData}
      onDeleteExistingData={deleteExistingClosureData}
    />
  );
```

---

### 3. Modification de `src/components/project/closure/ClosureStepIntro.tsx`

Adapter l'interface pour afficher un avertissement si des données existent.

#### A. Nouvelles props

```typescript
interface ClosureStepIntroProps {
  projectTitle: string;
  onContinue: () => void;
  onCancel: () => void;
  existingData?: {
    hasFinalReview: boolean;
    hasEvaluation: boolean;
  } | null;
  checkingExistingData?: boolean;
  onDeleteExistingData?: () => Promise<boolean>;
}
```

#### B. State local pour la confirmation de suppression

```typescript
const [isDeleting, setIsDeleting] = useState(false);
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
```

#### C. Ajouter un bloc d'avertissement conditionnel

Avant le bloc des étapes, ajouter :
```typescript
{/* Avertissement si des données de clôture existent */}
{existingData && (existingData.hasFinalReview || existingData.hasEvaluation) && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="space-y-2">
        <h3 className="font-medium text-amber-800">Données de clôture existantes</h3>
        <p className="text-sm text-amber-700">
          Ce projet possède déjà des données de clôture :
        </p>
        <ul className="text-sm text-amber-700 list-disc list-inside">
          {existingData.hasFinalReview && (
            <li>Une revue finale de projet</li>
          )}
          {existingData.hasEvaluation && (
            <li>Une évaluation de la méthode projet</li>
          )}
        </ul>
        <p className="text-sm text-amber-700">
          Pour créer une nouvelle clôture, vous devez d'abord supprimer ces données.
        </p>
      </div>
    </div>
    
    {!showDeleteConfirmation ? (
      <Button
        variant="outline"
        className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
        onClick={() => setShowDeleteConfirmation(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer les anciennes données
      </Button>
    ) : (
      <div className="space-y-2 pt-2 border-t border-amber-200">
        <p className="text-sm font-medium text-amber-800">
          Êtes-vous sûr de vouloir supprimer ces données ?
        </p>
        <p className="text-xs text-amber-600">
          Cette action est irréversible.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirmation(false)}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteExistingData}
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : "Confirmer la suppression"}
          </Button>
        </div>
      </div>
    )}
  </div>
)}
```

#### D. Handler pour la suppression

```typescript
const handleDeleteExistingData = async () => {
  if (!onDeleteExistingData) return;
  
  setIsDeleting(true);
  const success = await onDeleteExistingData();
  setIsDeleting(false);
  
  if (success) {
    setShowDeleteConfirmation(false);
  }
};
```

#### E. Désactiver le bouton "Commencer" si des données existent

```typescript
<Button 
  onClick={onContinue}
  disabled={checkingExistingData || (existingData && (existingData.hasFinalReview || existingData.hasEvaluation))}
>
  {checkingExistingData ? "Vérification..." : "Commencer la clôture"}
</Button>
```

---

## Résumé des modifications

| Fichier | Changements |
|---------|-------------|
| `useProjectClosure.ts` | Ajout de `checkExistingClosureData` et `deleteExistingClosureData` |
| `ProjectClosureDialog.tsx` | Appel de la vérification à l'ouverture, passage des props |
| `ClosureStepIntro.tsx` | Interface conditionnelle avec avertissement et suppression |

---

## Flux utilisateur après implémentation

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Ouverture du dialogue                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Vérification des données      │
              │ existantes (async)            │
              └───────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
   ┌─────────────────┐               ┌─────────────────────┐
   │ Aucune donnée   │               │ Données existantes  │
   │ → Continuer     │               │ → Avertissement     │
   └─────────────────┘               └─────────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ Supprimer données ? │
                                    └─────────────────────┘
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                                    ▼                     ▼
                           ┌──────────────┐      ┌──────────────┐
                           │   Oui        │      │   Non        │
                           │   → Supprime │      │   → Annuler  │
                           │   → Continue │      └──────────────┘
                           └──────────────┘
```

---

## Imports à ajouter

### ClosureStepIntro.tsx
```typescript
import { AlertTriangle, Trash2 } from "lucide-react";
```

---

## Avantages de cette solution

1. **Non-intrusif** : Ne modifie pas le comportement normal si aucune donnée n'existe
2. **Sécurisé** : Demande une double confirmation avant suppression
3. **Informatif** : L'utilisateur voit exactement quelles données seront supprimées
4. **Cohérent** : Suit les patterns d'interface existants dans l'application
5. **Complet** : Réinitialise également les champs de clôture du projet

