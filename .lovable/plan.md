

# Correction systémique des blocages de navigation

## Diagnostic final

Deux bugs combinés expliquent pourquoi le correctif ne tient pas au-delà du premier accès :

### Bug 1 : `dialog.tsx` laisse ses props écraser le nettoyage

```tsx
// dialog.tsx actuel — BUG
<DialogPrimitive.Content
  onCloseAutoFocus={(e) => { resetInteractionLocks(); }} // posé en premier
  {...props}  // ← tout onCloseAutoFocus passé en prop ÉCRASE le nettoyage
>
```

6 composants passent leur propre `onCloseAutoFocus` à `DialogContent` et ne nettoient jamais `pointer-events` : `ProjectClosureDialog`, `PortfolioReviewForm`, `PortfolioReviewNotificationDialog` (×2), `PortfolioReviewList`, etc. Chaque fermeture de ces dialogs laisse le verrou actif.

`alert-dialog.tsx` gère correctement ce cas (destructure + appelle les deux), mais `dialog.tsx` et `sheet.tsx` ne le font pas.

### Bug 2 : le `setTimeout(600ms)` est une course impossible à gagner

Il nettoie pile une fois, 600ms après le changement de route. Mais Radix peut ré-appliquer `pointer-events: none` à n'importe quel moment pendant le démontage (stacked dialogs, animations chaînées). Sur les navigations suivantes, le timing change et le verrou persiste.

## Plan de correction

### 1. Corriger `dialog.tsx` et `sheet.tsx` — même pattern que `alert-dialog.tsx`

Destructurer `onCloseAutoFocus` et `onAnimationEnd` des props, appeler le nettoyage PUIS le handler utilisateur :

```tsx
// dialog.tsx — CORRIGÉ
const DialogContent = React.forwardRef<...>(
  ({ className, children, onCloseAutoFocus, onAnimationEnd, ...props }, ref) => (
    <DialogPrimitive.Content
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        resetInteractionLocks();
        onCloseAutoFocus?.(e);
      }}
      onAnimationEnd={(e) => {
        resetInteractionLocks();
        onAnimationEnd?.(e);
      }}
      {...props}
    >
```

Même modification pour `sheet.tsx`.

### 2. Remplacer le `setTimeout` par un `MutationObserver` dans `ProtectedRoute`

Au lieu de deviner un délai, observer les mutations de style sur `body` et nettoyer automatiquement quand `pointer-events: none` est appliqué alors qu'aucun overlay Radix n'est ouvert :

```tsx
useEffect(() => {
  resetInteractionLocks();

  const observer = new MutationObserver(() => {
    if (document.body.style.pointerEvents === 'none') {
      // Vérifier si un overlay Radix est réellement ouvert
      const hasOpenOverlay = document.querySelector('[data-state="open"][role="dialog"]');
      if (!hasOpenOverlay) {
        resetInteractionLocks();
      }
    }
  });

  observer.observe(document.body, { 
    attributes: true, 
    attributeFilter: ['style'] 
  });

  return () => observer.disconnect();
}, [pathname]);
```

Cela couvre tous les cas de timing sans délai arbitraire.

### 3. Harmoniser les handlers `onCloseAutoFocus` existants dans les composants métier

Maintenant que les primitives appellent toujours `resetInteractionLocks()` en interne, les handlers custom dans les composants métier n'ont plus besoin de gérer `pointer-events` eux-mêmes. Nettoyage optionnel mais recommandé dans :
- `DeleteProjectDialog.tsx`
- `ProjectClosureDialog.tsx`
- `PortfolioReviewForm.tsx`
- `PortfolioReviewNotificationDialog.tsx`
- `PortfolioReviewList.tsx`
- `ProjectNotesList.tsx`
- `TaskForm.tsx`

On y retire les lignes `unlockPointerEvents()` / `document.body.style.pointerEvents = ""` devenues redondantes.

## Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/components/ui/dialog.tsx` | Destructurer `onCloseAutoFocus`/`onAnimationEnd` pour garantir le nettoyage |
| `src/components/ui/sheet.tsx` | Idem |
| `src/components/ProtectedRoute.tsx` | Remplacer `setTimeout` par `MutationObserver` |
| 7 composants métier | Retirer les nettoyages manuels redondants (optionnel, réduction de dette) |

## Risque

Faible. Le `MutationObserver` ne bloque que les verrous orphelins (aucun dialog ouvert). Quand un modal est réellement ouvert, `pointer-events: none` est légitime et conservé. Les primitives UI garantissent le nettoyage à la fermeture quel que soit le handler passé par le composant parent.

