

# Séparer Risques et Difficultés dans les présentations

## Diagnostic

Actuellement, le bloc "DIFFICULTÉS EN COURS" mélange deux sources de données :
- Si `lastReview.difficulties` est renseigné → affiche les difficultés de la revue
- Sinon → fallback sur `data.risks` (les risques du projet)

Ce comportement masque les risques quand des difficultés existent, et affiche les risques sous un titre trompeur quand il n'y en a pas.

## Plan : passer de 2 blocs à 3 blocs en dernière ligne

La dernière ligne contiendra :
- **RISQUES IDENTIFIÉS** (gauche) — risques du projet avec indicateur de niveau (probabilité/sévérité)
- **DIFFICULTÉS EN COURS** (centre) — texte libre issu exclusivement de `lastReview.difficulties`
- **ACTIONS CORRECTIVES** (droite) — inchangé

### 1. Vue écran — `PresentationSlide.tsx`

Transformer la grille `grid-cols-2` de la dernière ligne en `grid-cols-3` :

- **Bloc 1 — RISQUES IDENTIFIÉS** : liste les risques avec un badge coloré par niveau (combinaison probabilité × sévérité : 🔴 haute, 🟠 moyenne, 🟢 basse)
- **Bloc 2 — DIFFICULTÉS EN COURS** : affiche uniquement `data.lastReview?.difficulties` (texte libre), sans fallback sur les risques
- **Bloc 3 — ACTIONS CORRECTIVES** : inchangé

### 2. Export PPTX — `slideGenerators.ts`

Modifier `addDifficultiesAndActionsSection` pour générer 3 colonnes :

| Bloc | Position X | Largeur | Contenu |
|------|-----------|---------|---------|
| RISQUES IDENTIFIÉS | `grid.x` | 3.0 | Liste des risques avec niveau (ex: `[H] Description`) |
| DIFFICULTÉS EN COURS | `grid.x + 3.1` | 3.0 | `lastReview.difficulties` uniquement |
| ACTIONS CORRECTIVES | `grid.x + 6.2` | 3.1 | Inchangé |

Les risques seront formatés avec un préfixe indiquant le niveau : `[E]` élevé, `[M]` moyen, `[F]` faible, déterminé par la combinaison probabilité/sévérité.

### 3. Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/components/presentation/PresentationSlide.tsx` | Dernière ligne : `grid-cols-2` → `grid-cols-3`, ajout bloc Risques, suppression fallback risques dans Difficultés |
| `src/components/pptx/slideGenerators.ts` | Fonction `addDifficultiesAndActionsSection` → 3 colonnes au lieu de 2 |

Aucune modification de type ni de requête nécessaire — les données `risks` et `lastReview.difficulties` sont déjà présentes dans `ProjectData`.

