

# Export Excel avec visualisation Gantt depuis la vue Gantt des taches

## Objectif

Ajouter un bouton d'export Excel dans la barre d'outils de la vue Gantt (`TaskGantt.tsx`) qui genere un fichier Excel contenant la liste des taches **et** une representation visuelle du Gantt sous forme de cellules colorees representant la duree de chaque tache sur une echelle temporelle.

## Principe de la visualisation Gantt dans Excel

Le fichier Excel genere contiendra :
- **Colonnes fixes** (a gauche) : Nom de la tache, Statut, Date debut, Date fin, Avancement
- **Colonnes temporelles** (a droite) : une colonne par semaine (ou par jour selon la granularite) couvrant la plage temporelle de toutes les taches. Chaque cellule correspondant a une periode ou la tache est active sera coloree avec un fond correspondant au statut (gris = a faire, bleu = en cours, vert = termine)

```text
| Nom         | Statut   | Debut      | Fin        | Avancement | S1  | S2  | S3  | S4  | S5  |
|-------------|----------|------------|------------|------------|-----|-----|-----|-----|-----|
| Tache A     | En cours | 01/03/2026 | 15/03/2026 |    50%     | [=] | [=] | [=] |     |     |
| Tache B     | A faire  | 10/03/2026 | 28/03/2026 |     0%     |     | [=] | [=] | [=] | [=] |
```

Les cellules actives sont remplies avec une couleur de fond (pas de texte), ce qui reproduit visuellement un diagramme de Gantt directement dans Excel.

## Modifications techniques

### 1. Nouveau fichier utilitaire : `src/utils/ganttExcelExport.ts`

Fonction principale `exportGanttToExcel(tasks: Task[], projectTitle?: string)` :

- **Calcul de la plage temporelle** : trouver la date min et max parmi toutes les taches, avec une marge d'une semaine de chaque cote
- **Generation des colonnes temporelles** : creer une colonne par semaine (lundi de chaque semaine) entre date min et date max
- **Construction des donnees** :
  - Ligne d'en-tete : colonnes fixes + dates des semaines formatees (ex: "03/03", "10/03", ...)
  - Lignes de taches : donnees textuelles + cellules vides ou marquees pour les periodes actives
- **Application des styles Excel** (via les capacites de `xlsx`) :
  - Couleur de fond des cellules Gantt selon le statut de la tache
  - En-tetes en gras avec fond gris
  - Largeurs de colonnes adaptees (colonnes temporelles etroites ~4 caracteres)
- **Generation du fichier** : `gantt-[projectTitle]-[date].xlsx`

### 2. Modification de `src/components/task/TaskGantt.tsx`

- Importer la fonction `exportGanttToExcel` et l'icone `FileSpreadsheet`
- Ajouter un bouton "Export Gantt Excel" dans la barre d'outils (a cote du bouton "Masquer/Afficher liste")
- Au clic, appeler `exportGanttToExcel(ganttTasks, projectTitle)` avec les taches deja formatees

### 3. Props de `TaskGantt`

- Ajouter une prop optionnelle `projectTitle?: string` pour nommer le fichier d'export. Si non fournie, utiliser "projet" par defaut.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/utils/ganttExcelExport.ts` | Creation - logique d'export Excel avec Gantt visuel |
| `src/components/task/TaskGantt.tsx` | Modification - ajout du bouton d'export et de la prop `projectTitle` |
| `src/pages/TaskManagement.tsx` | Modification - passer `projectTitle` au composant `TaskGantt` |

## Limites connues

La bibliotheque `xlsx` (version community) ne supporte pas nativement les couleurs de cellules. Deux approches possibles :
- **Approche retenue** : utiliser un marqueur textuel (ex: caractere plein "█" ou "X") dans les cellules actives avec une mise en forme conditionnelle basique, ce qui reste lisible et fonctionnel
- Les couleurs de fond reelles necessiteraient `xlsx-style` ou `exceljs`, mais pour rester coherent avec les dependances existantes, on reste sur `xlsx` avec des marqueurs visuels

## Sequencement

1. Creer `ganttExcelExport.ts` avec la logique complete
2. Modifier `TaskGantt.tsx` pour ajouter le bouton et la prop
3. Modifier `TaskManagement.tsx` pour transmettre le titre du projet

