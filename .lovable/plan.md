

# Correctif : défilement et lisibilité dans le BulkRoleWizard

## Problèmes identifiés

1. **Pas de défilement visible** : Le `ScrollArea` avec `maxHeight: "40vh"` ne suffit pas car le conteneur parent (`DialogContent`) ne contraint pas correctement la hauteur. Le contenu déborde sans barre de défilement.
2. **Noms tronqués par les badges de rôles** : La ligne utilisateur utilise `flex` avec les badges en fin de ligne. Quand un utilisateur a beaucoup de rôles, les badges poussent le nom hors de la zone visible.

## Correctifs

### Fichier unique : `src/components/admin/BulkRoleWizard.tsx`

**1. Layout de chaque ligne utilisateur (étape 2, lignes 399-420)**

Passer d'un layout horizontal à un layout en deux lignes :
- Ligne 1 : checkbox + nom complet + email
- Ligne 2 : badges de rôles (en dessous, avec un léger padding à gauche pour aligner avec le nom)

```text
Avant :
  <label className="flex items-center gap-3 ...">
    <Checkbox />
    <div className="flex-1 min-w-0">nom + email</div>
    <div className="flex gap-1 flex-wrap">badges</div>
  </label>

Après :
  <label className="flex items-start gap-3 p-2 ...">
    <Checkbox className="mt-0.5" />
    <div className="flex-1 min-w-0">
      <div>nom + email (truncate)</div>
      <div className="flex gap-1 flex-wrap mt-1">badges</div>
    </div>
  </label>
```

**2. ScrollArea avec hauteur fixe en pixels (étape 2 et étape 3)**

Remplacer `style={{ maxHeight: "40vh" }}` par une hauteur fixe calculée qui fonctionne mieux dans le contexte du Dialog :
- Étape 2 : `h-[300px]` sur le ScrollArea (au lieu de `maxHeight: 40vh`)
- Étape 3 : même approche `h-[350px]`

Cela garantit que le composant `ScrollArea` de Radix a une hauteur explicite et génère bien la barre de défilement.

**3. Même correction pour la liste de l'étape 3 (synthèse)**

Les noms dans la liste de confirmation (étape 3) doivent aussi utiliser le layout en deux lignes si les badges sont affichés.

### Résumé des modifications

| Élément | Modification |
|---------|-------------|
| Ligne utilisateur (étape 2) | Layout vertical : nom au-dessus, badges en dessous |
| ScrollArea étape 2 | `className="h-[300px]"` au lieu de `style={{ maxHeight: "40vh" }}` |
| ScrollArea étape 3 | `className="h-[350px]"` au lieu de `style={{ maxHeight: "55vh" }}` |

Un seul fichier modifié.

