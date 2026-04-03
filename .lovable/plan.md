

# Correctif — Bouton "retour" inopérant au chargement de la page synthèse projet

## Cause racine

Le nettoyage `resetInteractionLocks()` dans `ProtectedRoute` s'exécute **immédiatement** au changement de `pathname`. Mais les composants Radix (Sheet, Dialog) de la page **précédente** se démontent avec une animation de 200-500ms. Pendant cette animation, Radix **ré-applique** `pointer-events: none` sur le `body`, écrasant le nettoyage déjà effectué.

C'est pourquoi :
- le bouton "retour" ne fonctionne pas dès l'arrivée sur la page ;
- n'importe quel clic ultérieur débloque la page (l'animation Radix est alors terminée) ;
- le problème se manifeste surtout quand on vient d'une page riche en overlays (`/projects`).

## Correction

### Fichier unique : `src/components/ProtectedRoute.tsx`

Modifier l'effect 3 (nettoyage des verrous) pour ajouter un **second nettoyage différé** après la fin des animations Radix :

```tsx
// Effect 3 : nettoyage des verrous d'interaction à chaque changement de route
useEffect(() => {
  // Nettoyage immédiat
  resetInteractionLocks();
  
  // Nettoyage différé pour rattraper les verrous ré-appliqués
  // par les animations de fermeture Radix (durée max: 500ms)
  const timer = setTimeout(() => {
    resetInteractionLocks();
  }, 600);
  
  return () => clearTimeout(timer);
}, [pathname]);
```

C'est la solution la plus ciblée et la moins risquée : pas de MutationObserver, pas de CSS global, pas de modification des primitives Radix.

## Impact

| Fichier | Modification |
|---|---|
| `src/components/ProtectedRoute.tsx` | Ajout d'un `setTimeout` de 600ms dans l'effect existant |

Aucune régression possible : le nettoyage est idempotent (remettre des chaînes vides sur des propriétés déjà vides est sans effet).

