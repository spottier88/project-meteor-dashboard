

## Analyse du problème

Le bouton "Historique des revues" s'affiche actuellement dans toutes les situations. Il doit être conditionnel à l'existence d'un historique de revues (au moins une revue enregistrée).

## Solution proposée

**Fichier modifié** : `src/components/LastReview.tsx`

### Option 1 : Utiliser la prop `previousReview` existante (recommandée)

La prop `previousReview` est déjà passée au composant et indique qu'il existe une revue antérieure. On peut utiliser cette information pour conditionner l'affichage :

```typescript
// Afficher le bouton seulement s'il y a une revue précédente
{previousReview && historyButton}
```

### Option 2 : Ajouter une prop `reviewCount` explicite

Si on veut afficher le bouton dès qu'il y a au moins une revue (même sans revue précédente connue) :

- Ajouter `reviewCount?: number` aux props
- Condition : `{reviewCount && reviewCount > 0 && historyButton}`

### Option retenue : Option 1

La prop `previousReview` existe déjà et est fiable. Elle indique explicitement qu'il y a un historique.

**Changement unique dans LastReview.tsx** :

Remplacer l'affichage inconditionnel du `historyButton` par :
```typescript
<div className="flex items-center gap-2">
  {previousReview && historyButton}
  <span className="text-sm text-muted-foreground">
    {new Date(review.created_at).toLocaleDateString("fr-FR")}
  </span>
</div>
```

Et dans le cas `!review` (aucune revue), ne pas afficher le bouton du tout.

