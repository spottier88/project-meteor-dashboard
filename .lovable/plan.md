
# Refonte de la matrice cartographique

## Constat
La matrice actuelle affiche **un point par projet**. Les bulles se superposent sur les mêmes coordonnées (météo discrète + avancements proches) et la vue ne fait pas ressortir de tendance.

## Proposition principale : matrice agrégée par groupe

Chaque bulle représente **un groupe de projets** au lieu d'un projet individuel.

- **Axe X** : avancement moyen du groupe (0–100%)
- **Axe Y** : météo dominante du groupe (Orageux / Nuageux / Ensoleillé)
- **Taille de bulle** : nombre de projets du groupe (échelle racine carrée pour rester lisible)
- **Couleur** : selon la dimension de regroupement
- **Bordure violette** : épaisseur proportionnelle au % de projets innovants du groupe
- **Label dans la bulle** : nombre de projets (ex. « 12 »)

### Sélecteur « Regrouper par » au-dessus du graphique
1. **Direction** (par défaut)
2. **Cycle de vie** (étude, validé, en cours, terminé, suspendu, abandonné)
3. **Pôle**
4. **Aucun** (mode actuel, un point par projet — conservé en option)

### Interactions
- **Hover** : tooltip — nom du groupe, nb projets, avancement moyen, mini-répartition météo, nb projets innovants
- **Clic sur une bulle** : ouvre un panneau latéral (Sheet) listant les projets du groupe avec lien vers chaque fiche projet
- Filtres existants (direction / météo / cycle de vie / innovation) appliqués **avant** agrégation

## Vues complémentaires proposées (à choisir)

### A. Quadrants stratégiques (BCG-like)
Matrice 2×2 sur la même base, avec 4 zones colorées et nommées : **À sécuriser**, **À accélérer**, **À surveiller**, **À finaliser**. Lecture immédiate pour un comité de pilotage.

### B. Barres empilées par direction
Une barre horizontale par direction, segmentée par météo (vert/orange/rouge), longueur = nb projets, avancement moyen affiché à droite. Très lisible en synthèse.

### C. Bubble matrix Direction × Cycle de vie
Grille lignes (directions) × colonnes (cycles de vie), bulle à chaque croisement (taille = nb projets, couleur = météo dominante). Plus dense, idéal pour les portefeuilles riches.

## Recommandation
Remplacer la matrice actuelle par la **matrice agrégée** (avec sélecteur « Regrouper par » + option « Aucun » pour garder le mode détaillé). Garder Heatmap et Treemap intacts. Ajouter éventuellement **A. Quadrants stratégiques** comme deuxième sous-vue dans le bloc « Matrice ».

## Détails techniques
- **Fichier modifié** : `src/components/portfolio/cartography/CartographyBubbleMatrix.tsx`
- **Agrégation** (interne) : `groupBy(projects, key)` → `{ count, avgCompletion, dominantWeather, weatherBreakdown, innovativePct }`
- **Recharts** : `ScatterChart` + `ZAxis` (`range=[400, 4000]`) pour la taille variable
- **Drill-down** : nouveau `CartographyGroupDetailsSheet.tsx` (Sheet shadcn, `overflow-y-auto`, `resetInteractionLocks` sur close)
- **Sélecteur** : `Select` shadcn local au composant, valeur par défaut `direction`
- **Quadrants (option A)** : `ReferenceArea` Recharts + labels

## Questions à valider
1. **Vues complémentaires** : on garde uniquement la matrice agrégée, ou on ajoute aussi A (quadrants), B (barres empilées) et/ou C (Direction × Cycle de vie) ?
2. **Mode « 1 bulle = 1 projet »** : on le conserve en option « Regrouper par : Aucun » ou on le supprime totalement ?
