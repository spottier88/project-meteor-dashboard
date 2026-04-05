

# Correctif — Flèches de navigation du calendrier superposées aux jours

## Diagnostic

Les boutons de navigation (flèches mois précédent/suivant) sont positionnés en `absolute` avec `left-1` et `right-1` (lignes 41-48). Ils sont rendus à l'intérieur du conteneur `nav`, mais leur positionnement absolu les fait déborder sur la grille des jours en dessous.

Le problème vient de la structure v9 de `react-day-picker` : le `nav` et le `month_caption` ne forment pas un conteneur isolé. Les boutons absolus se positionnent par rapport au `month` (qui a `position: relative` implicite via `space-y-4`), et chevauchent donc la première ligne de jours — visible sur le "12" et le dimanche en général.

## Correction

### Fichier : `src/components/ui/calendar.tsx`

Deux modifications :

1. **Rendre `month_caption` le contexte de positionnement** en ajoutant `relative` (déjà présent) mais aussi une hauteur suffisante et un z-index supérieur pour que les boutons restent au-dessus de la grille sans la chevaucher.

2. **Ajouter `z-10`** aux boutons `button_previous` et `button_next` pour qu'ils passent au-dessus, et surtout **changer le conteneur `nav`** pour utiliser un layout flex entre les flèches et le label, supprimant le positionnement absolu fragile.

Approche retenue — **remplacer le positionnement absolu par un layout flex** :

```tsx
month_caption: "flex justify-center pt-1 relative items-center h-10",
nav: "flex items-center justify-between absolute inset-x-0 top-0 h-10 px-1 z-10",
button_previous: cn(
  buttonVariants({ variant: "outline" }),
  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
),
button_next: cn(
  buttonVariants({ variant: "outline" }),
  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
),
```

Changements clés :
- `nav` devient le conteneur positionné en absolu avec `inset-x-0` et `z-10`, couvrant toute la largeur du header sans déborder sur la grille
- `button_previous` et `button_next` perdent leur `absolute` individuel — ils sont positionnés par le flex du `nav`
- Le `z-10` sur `nav` garantit que les flèches sont cliquables sans chevaucher visuellement les cellules de jours

## Impact

| Fichier | Modification |
|---|---|
| `src/components/ui/calendar.tsx` | Remplacement du positionnement absolu des boutons par un layout flex dans `nav` |

Aucune régression attendue : le changement est purement CSS/layout, limité au composant calendrier.

