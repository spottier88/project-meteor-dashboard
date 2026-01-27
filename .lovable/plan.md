
# Plan de remédiation : Gestion du focus dans le processus de clôture de projet

## Problème identifié

Après la fermeture du dialogue de clôture (annulation, validation ou report), l'utilisateur perd le focus et l'interface devient difficile à naviguer.

### Cause technique

L'interaction entre le **DropdownMenu** (modal par défaut) et le **Dialog** de clôture crée un conflit de focus trap :
1. Le `DropdownMenuItem` déclenche l'ouverture du Dialog puis disparaît du DOM
2. À la fermeture du Dialog, Radix UI ne trouve pas l'élément d'origine pour restituer le focus
3. Les `pointer-events` peuvent rester bloqués sur certains éléments

---

## Solution proposée

Appliquer les patterns de gestion du focus déjà utilisés dans l'application (notamment dans `ProjectNoteCard`, `PortfolioReviewForm`, `ProjectNotesList`).

---

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/project/ProjectSummaryActions.tsx` | Ajouter `modal={false}` au DropdownMenu |
| `src/components/project/closure/ProjectClosureDialog.tsx` | Ajouter gestion explicite du focus à la fermeture + nettoyage des pointer-events |

---

## Détails techniques

### 1. Modification de `ProjectSummaryActions.tsx`

Ajouter `modal={false}` au composant `DropdownMenu` pour éviter le conflit de focus trap.

**Ligne 257 - Avant :**
```typescript
<DropdownMenu>
```

**Après :**
```typescript
<DropdownMenu modal={false}>
```

Cette modification permet au Dialog de clôture de gérer le focus sans interférence du DropdownMenu.

---

### 2. Modification de `ProjectClosureDialog.tsx`

Ajouter une gestion explicite du focus et un nettoyage des pointer-events à la fermeture du dialogue.

#### A. Ajouter la fonction utilitaire de nettoyage

Au début du fichier, après les imports :
```typescript
/**
 * Nettoie les pointer-events résiduels après fermeture de modale
 * Radix UI peut parfois laisser pointer-events: none après fermeture
 */
const unlockPointerEvents = () => {
  document.body.style.pointerEvents = "";
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.pointerEvents = "";
  document.documentElement.style.removeProperty("pointer-events");
};
```

#### B. Modifier la fonction `onClose` pour nettoyer les pointer-events

Créer une fonction wrapper pour la fermeture qui nettoie les pointer-events :
```typescript
// Fonction de fermeture avec nettoyage du focus
const handleClose = () => {
  // Nettoyer les pointer-events résiduels
  unlockPointerEvents();
  // Rendre le focus au body
  document.body.focus();
  // Appeler la fonction de fermeture parente
  onClose();
};
```

Remplacer tous les appels à `onClose` par `handleClose` dans le composant.

#### C. Ajouter `onCloseAutoFocus` au DialogContent

Modifier le `DialogContent` pour gérer explicitement le focus à la fermeture :
```typescript
<DialogContent 
  className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
  onCloseAutoFocus={(event) => {
    event.preventDefault();
    unlockPointerEvents();
    document.body.focus();
  }}
>
```

#### D. Modifier le handler `onOpenChange` du Dialog

```typescript
<Dialog 
  open={isOpen} 
  onOpenChange={(open) => {
    if (!open) {
      handleClose();
    }
  }}
>
```

---

## Résumé des changements

| Composant | Changement | Effet |
|-----------|------------|-------|
| `DropdownMenu` | `modal={false}` | Désactive le focus trap du menu déroulant |
| `DialogContent` | `onCloseAutoFocus` | Empêche le focus automatique de Radix et force le focus sur le body |
| Nouvelle fonction | `unlockPointerEvents` | Nettoie les styles résiduels qui bloquent les interactions |
| Nouvelle fonction | `handleClose` | Centralise la logique de fermeture avec nettoyage |

---

## Comportement attendu après correction

1. **Ouverture du dialogue** : Le dialogue de clôture s'ouvre normalement depuis le menu déroulant
2. **Annulation** (bouton Annuler ou clic hors du dialogue) : Le focus revient au body, l'interface reste interactive
3. **Validation** (clôture complète ou report) : Le focus revient au body après la fermeture du dialogue
4. **Complétion d'évaluation** : Même comportement fluide lors de la complétion d'une évaluation en attente

---

## Cohérence avec l'existant

Cette approche suit les mêmes patterns déjà utilisés dans :
- `src/components/notes/ProjectNoteCard.tsx` (ligne 102) - `modal={false}`
- `src/components/notes/ProjectNotesList.tsx` (lignes 31-36) - `unlockPointerEvents`
- `src/components/portfolio/PortfolioReviewForm.tsx` (lignes 101-104) - `onCloseAutoFocus`
- `src/components/portfolio/PortfolioReviewList.tsx` (lignes 262-265) - gestion du focus

L'implémentation garantit une expérience utilisateur cohérente dans toute l'application.
