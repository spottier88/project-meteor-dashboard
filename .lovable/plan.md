

# Évolution du composant Gantt — Analyse et scénarios

## Situation actuelle

L'application utilise **`gantt-task-react` v0.3.9**, une bibliothèque open-source dont la dernière publication date de 2021. Elle est utilisée dans 4 contextes :

| Contexte | Composant | Usage |
|---|---|---|
| Tâches d'un projet | `TaskGantt.tsx` | Drag & drop des dates, double-clic pour éditer |
| Multi-projets (panier) | `ProjectGanttSheet.tsx` | Lecture seule, expand/collapse projets |
| Multi-projets (portefeuille) | `PortfolioGanttSheet.tsx` | Lecture seule, expand/collapse projets |
| Vue macro projets | `ProjectGanttView.tsx` | Lecture seule, toggle tâches, export |

### Limites constatées de `gantt-task-react`

- **Bibliothèque non maintenue** (dernière release 2021, aucune mise à jour depuis)
- **Pas de gestion native des dépendances visuelles** (flèches entre tâches)
- **Pas de drag & drop pour créer des liens** entre tâches
- **API de personnalisation très limitée** : colonnes de la liste non configurables, pas de filtres intégrés, pas de tri
- **Pas de zoom fluide** (changement de vue par boutons uniquement)
- **Performance médiocre** au-delà de ~100 tâches
- **Types TypeScript incomplets**, nécessitant des contournements (`TaskType` redéfini manuellement)
- **Pas de mode édition inline** (nom de tâche, dates dans la grille)

## Scénarios d'évolution

---

### Scénario 1 — SVAR React Gantt (recommandé)

**Bibliothèque** : `@svar-ui/react-gantt` — MIT, open-source, pure React, activement maintenue (2024-2026).

**Avantages** :
- Pure React (pas un wrapper DOM) → meilleure intégration avec l'écosystème existant
- Drag & drop natif (déplacement, redimensionnement, progression)
- Liens de dépendances visuels (flèches) avec création par drag
- Colonnes de grille configurables et triables
- Échelles de temps configurables (heure, jour, semaine, mois, trimestre, année)
- Gestion performante de gros volumes de tâches
- TypeScript natif
- Licence MIT = aucun coût

**Limites** : pas de calendrier de jours ouvrés ni de baselines dans l'édition gratuite (disponible en PRO payant).

**Effort estimé** : 3-4 jours de développement

---

### Scénario 2 — Frappe Gantt

**Bibliothèque** : `frappe-gantt` v1.2 — MIT, légère, SVG.

**Avantages** :
- Très léger (~63 KB), rendu SVG élégant
- Drag & drop des barres, popup de détails personnalisable
- Activement maintenu (dernière release février 2026)
- Simple à intégrer

**Limites** :
- **Pas un composant React natif** → nécessite un wrapper avec `useRef` + gestion manuelle du DOM
- Pas de grille/liste de tâches intégrée (uniquement les barres)
- Pas de dépendances visuelles éditables par drag
- Pas de hiérarchie projet/tâche native (expand/collapse à gérer manuellement)

**Effort estimé** : 4-5 jours (wrapper React + liste de tâches à recréer)

---

### Scénario 3 — DHTMLX Gantt (commercial)

**Bibliothèque** : `@dhtmlx/trial-react-gantt` — licence commerciale (~$599/dev).

**Avantages** :
- Solution la plus complète du marché : chemin critique, auto-scheduling, calendrier de ressources, baselines
- Support technique professionnel
- Wrapper React officiel

**Limites** :
- **Licence payante** (par développeur, annuelle)
- Wrapper autour d'un moteur DOM (pas pure React)
- API complexe, courbe d'apprentissage importante

**Effort estimé** : 2-3 jours de développement, mais coût de licence

---

### Scénario 4 — Développement custom

Construire un composant Gantt sur mesure en SVG/Canvas avec React.

**Avantages** :
- Contrôle total sur le rendu et les fonctionnalités
- Parfaitement adapté aux besoins spécifiques

**Limites** :
- **Effort très élevé** : 15-25 jours minimum pour un résultat équivalent
- Maintenance pérenne à assurer en interne
- Risque de bugs et de performances

**Non recommandé** sauf contrainte très spécifique.

---

## Comparatif synthétique

| Critère | gantt-task-react (actuel) | SVAR Gantt | Frappe Gantt | DHTMLX |
|---|---|---|---|---|
| Maintenance active | Non (2021) | Oui (2026) | Oui (2026) | Oui |
| Pure React | Oui | Oui | Non (wrapper) | Non (wrapper) |
| Licence | MIT | MIT | MIT | Commercial |
| Dépendances visuelles | Non | Oui (flèches) | Limitées | Oui |
| Drag & drop | Basique | Complet | Barres seules | Complet |
| Grille configurable | Non | Oui | Non intégrée | Oui |
| Hiérarchie/expand | Basique | Oui | Non | Oui |
| TypeScript | Partiel | Natif | Non | Oui |
| Performance (>100 tâches) | Faible | Bonne | Moyenne | Excellente |

## Plan de mise en œuvre — Scénario 1 (SVAR React Gantt)

### Étape 1 — Installation et composant de base
- Installer `@svar-ui/react-gantt`
- Supprimer `gantt-task-react`
- Créer un nouveau composant wrapper `GanttChart.tsx` avec la configuration SVAR (échelles, colonnes, thème)

### Étape 2 — Adaptation du mapping de données
- Adapter `gantt-helpers.ts` pour transformer les tâches au format SVAR (`id`, `text`, `start`, `end`, `duration`, `progress`, `parent`, `type`)
- Adapter `ProjectGanttView.tsx` pour le format multi-projets
- Mapper les liens de dépendances (`links`) si la donnée existe

### Étape 3 — Migration des 4 contextes d'usage
- `TaskGantt.tsx` : remplacer par le nouveau composant avec drag & drop + callbacks `onDateChange`
- `ProjectGanttView.tsx` : remplacer avec expand/collapse projets natif
- `ProjectGanttSheet.tsx` et `PortfolioGanttSheet.tsx` : remplacer par le nouveau composant en mode lecture seule

### Étape 4 — Export et fonctionnalités annexes
- Adapter `ganttExcelExport.ts` au nouveau format de données
- Adapter `GanttExportButtons.tsx` pour l'export image (capture du nouveau DOM)
- Vérifier le thème CSS (compatibilité dark mode, couleurs cohérentes)

### Étape 5 — Nettoyage
- Supprimer `gantt-task-react` de `package.json`
- Supprimer `src/styles/gantt.css` (remplacer par le thème SVAR)
- Supprimer les types `TaskType` manuels dans `gantt-helpers.ts`

### Fichiers impactés

| Fichier | Action |
|---|---|
| `package.json` | Remplacer `gantt-task-react` par `@svar-ui/react-gantt` |
| `src/components/task/TaskGantt.tsx` | Réécriture avec SVAR |
| `src/components/gantt/ProjectGanttView.tsx` | Réécriture avec SVAR |
| `src/components/cart/ProjectGanttSheet.tsx` | Adaptation |
| `src/components/portfolio/PortfolioGanttSheet.tsx` | Adaptation |
| `src/utils/gantt-helpers.ts` | Nouveau format de mapping |
| `src/utils/ganttExcelExport.ts` | Adaptation au nouveau format |
| `src/components/gantt/GanttExportButtons.tsx` | Adaptation |
| `src/components/gantt/types.ts` | Simplification (types SVAR natifs) |
| `src/styles/gantt.css` | Remplacement par thème SVAR |

### Effets de bord

| Risque | Impact | Mitigation |
|---|---|---|
| API SVAR différente de gantt-task-react | Tous les callbacks (onDateChange, onExpanderClick, etc.) doivent être réécrits | Mapping systématique dans le wrapper |
| Format de données différent | Les transformations existantes ne sont plus valides | Réécriture centralisée dans `gantt-helpers.ts` |
| Style visuel différent | L'apparence du Gantt change | Personnalisation CSS/thème pour maintenir la cohérence |
| Export Excel | Le format d'entrée change | Adaptation de `ganttExcelExport.ts` |

