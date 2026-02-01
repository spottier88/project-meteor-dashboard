
# Plan de correction : Mode lecture seule pour projets clôturés

## Problème identifié

Le statut "clôturé" d'un projet n'est pas correctement appliqué au démarrage car :

1. **Dans `ProjectCard` et `ProjectTableRow`** : Le hook `useProjectPermissions` effectue des requêtes asynchrones pour chaque projet. Au premier rendu, les permissions ne sont pas encore chargées.

2. **Données disponibles non utilisées** : Le `lifecycle_status` est **déjà présent** dans `ProjectListItem` (données de la liste), mais il n'est **pas exploité** pour bloquer les actions.

3. **Absence de prop `isProjectClosed`** : Les composants `ProjectActions`, `ProjectCard` et `ProjectTableRow` n'ont pas de prop pour recevoir le statut clôturé de manière synchrone.

---

## Solution proposée

### Approche : Utiliser `lifecycle_status` comme source de vérité synchrone

Le `lifecycle_status === 'completed'` est disponible immédiatement dans les données de la liste des projets. Il faut le transmettre aux composants enfants pour bloquer les actions **dès le premier rendu**.

---

## Modifications à effectuer

### 1. Modifier `ProjectActions.tsx`

Ajouter une prop `isProjectClosed` pour forcer le mode lecture seule :

```typescript
interface ProjectActionsProps {
  // ... props existantes
  isProjectClosed?: boolean;  // NOUVEAU
}

// Dans le composant, calculer les permissions effectives :
const effectiveCanEdit = isProjectClosed ? false : _canEdit;
const effectiveCanManageTeam = isProjectClosed ? false : _canManageTeam;
const effectiveIsMember = isProjectClosed ? false : _isMember;
```

Puis utiliser ces variables effectives pour l'affichage des boutons.

---

### 2. Modifier `ProjectCardHeader.tsx`

Ajouter la prop `isProjectClosed` et la transmettre à `ProjectActions` :

```typescript
interface ProjectCardHeaderProps {
  // ... props existantes
  isProjectClosed?: boolean;  // NOUVEAU
}

// Transmettre à ProjectActions
<ProjectActions
  // ... autres props
  isProjectClosed={isProjectClosed}
/>
```

---

### 3. Modifier `ProjectCard.tsx`

Calculer `isProjectClosed` depuis `lifecycle_status` (disponible synchrone) et le transmettre :

```typescript
// Calculer le statut clôturé depuis les données du projet (synchrone)
const isProjectClosed = lifecycle_status === 'completed';

// Transmettre à ProjectCardHeader
<ProjectCardHeader
  // ... autres props
  isProjectClosed={isProjectClosed}
/>
```

Ajouter également un indicateur visuel (badge ou opacité réduite) pour les projets clôturés :

```tsx
{isProjectClosed && (
  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
    Clôturé
  </span>
)}
```

---

### 4. Modifier `ProjectTableRow.tsx`

Calculer `isProjectClosed` depuis `lifecycle_status` et le transmettre à `ProjectActions` :

```typescript
// Calculer le statut clôturé (la prop lifecycle_status est déjà disponible)
const isProjectClosed = project.lifecycle_status === 'completed';

// Transmettre à ProjectActions
<ProjectActions
  // ... autres props
  isProjectClosed={isProjectClosed}
/>
```

---

### 5. Mettre à jour `useProjectPermissions.tsx` (amélioration)

Modifier le hook pour utiliser `lifecycle_status` comme valeur par défaut durant le chargement :

Le hook doit retourner `isLoadingProjectAccess` pour permettre aux composants d'utiliser un fallback.

---

## Résumé des fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/project/ProjectActions.tsx` | Ajouter prop `isProjectClosed` et désactiver les actions si `true` |
| `src/components/project/ProjectCardHeader.tsx` | Ajouter prop `isProjectClosed` et la transmettre à `ProjectActions` |
| `src/components/ProjectCard.tsx` | Calculer `isProjectClosed` depuis `lifecycle_status` et transmettre + badge visuel |
| `src/components/project/ProjectTableRow.tsx` | Calculer `isProjectClosed` depuis `lifecycle_status` et transmettre à `ProjectActions` |

---

## Flux après correction

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Liste des projets chargée                    │
└─────────────────────────────────────────────────────────────────┘
                              │
     Chaque projet a lifecycle_status = 'completed' ou autre
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  ProjectCard / ProjectTableRow                         │
     │  - isProjectClosed = lifecycle_status === 'completed'  │
     │  - Calculé SYNCHRONIQUEMENT (pas de requête)           │
     └────────────────────────────────────────────────────────┘
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  ProjectActions reçoit isProjectClosed = true          │
     │  - Bouton "Modifier" masqué ✓                          │
     │  - Menu "Plus d'actions" masqué ou restreint ✓         │
     │  - Seul "Historique des revues" visible ✓              │
     └────────────────────────────────────────────────────────┘
                              │
                              ▼
     ┌────────────────────────────────────────────────────────┐
     │  Badge visuel "Clôturé" affiché ✓                      │
     │  L'utilisateur voit immédiatement le statut            │
     └────────────────────────────────────────────────────────┘
```

---

## Détails techniques

### Logique de `ProjectActions` avec `isProjectClosed`

```typescript
// Désactiver les actions si le projet est clôturé
const effectiveCanEdit = isProjectClosed ? false : _canEdit;
const effectiveCanManageTeam = isProjectClosed ? false : _canManageTeam;
const effectiveIsMember = isProjectClosed ? false : _isMember;

// Le bouton Modifier n'apparaît plus
{effectiveCanEdit && !_isSecondaryProjectManager && (
  <Button ... />
)}

// Le menu Plus d'actions n'apparaît plus ou est restreint
{(effectiveCanEdit || effectiveIsMember || effectiveCanManageTeam || _isAdmin) && (
  <DropdownMenu>...</DropdownMenu>
)}
```

### Indicateur visuel dans `ProjectCard`

```tsx
<div className="flex gap-2">
  {isProjectClosed && (
    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
      Clôturé
    </span>
  )}
  {/* ... autres badges existants */}
</div>
```

---

## Avantages de cette solution

1. **Synchrone** : Utilise `lifecycle_status` déjà disponible dans les données de la liste
2. **Pas de requête supplémentaire** : Pas d'attente asynchrone
3. **Immédiat** : Les actions sont masquées dès le premier rendu
4. **Cohérent** : Même comportement dans la liste (carte et tableau) et dans le résumé du projet
5. **Visuel** : Badge "Clôturé" visible immédiatement

---

## Tests recommandés

1. **Vue tableau des projets**
   - Charger la liste des projets
   - Vérifier que les projets clôturés n'ont pas de bouton "Modifier"
   - Vérifier que le menu "Plus d'actions" est restreint ou masqué

2. **Vue carte des projets**
   - Charger la liste des projets
   - Vérifier que les projets clôturés affichent un badge "Clôturé"
   - Vérifier que les actions sont masquées

3. **Accès direct à un projet clôturé**
   - Naviguer vers `/projects/{id}` d'un projet clôturé
   - Vérifier que le badge s'affiche immédiatement
   - Vérifier que les actions sont masquées

4. **Navigation depuis la liste vers un projet clôturé**
   - Cliquer sur un projet clôturé dans la liste
   - Vérifier la cohérence entre la liste et la page de résumé
