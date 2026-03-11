

# Amelioration de l'export Excel Gantt : ajout de couleurs et mise en forme avancee

## Constat actuel

L'export actuel utilise la bibliotheque `xlsx` (SheetJS community) qui ne supporte **pas** la mise en forme des cellules (couleurs de fond, bordures, polices). Le rendu repose sur des caracteres Unicode (`░`, `▓`, `■`) qui sont fonctionnels mais peu lisibles dans Excel.

## Solution proposee : migration vers ExcelJS

Remplacer `xlsx` par `exceljs` uniquement pour cet export Gantt. La bibliotheque `exceljs` supporte nativement :
- Couleurs de fond des cellules
- Bordures fines
- Police en gras, taille, couleur
- Fusion de cellules
- Alignement

### Rendu cible dans Excel

```text
| Nom           | Statut   | Debut      | Fin        | %   | 02/03 | 09/03 | 16/03 | 23/03 |
|---------------|----------|------------|------------|-----|-------|-------|-------|-------|
| Tache A       | En cours | 01/03      | 15/03      | 50  | [bleu]| [bleu]| [bleu]|       |
| Tache B       | A faire  | 10/03      | 28/03      |  0  |       | [gris]| [gris]| [gris]|
| Tache C       | Termine  | 01/03      | 08/03      | 100 | [vert]| [vert]|       |       |
```

Les cellules temporelles actives auront un **fond colore** (pas de texte) :
- Gris clair (`#E2E8F0`) pour "A faire"
- Bleu (`#3B82F6`) pour "En cours"
- Vert (`#22C55E`) pour "Termine"

### Ameliorations supplementaires

1. **Ligne d'en-tete stylee** : fond gris fonce, texte blanc, police en gras
2. **Colonne Statut coloree** : texte colore selon le statut (rouge/orange/vert)
3. **Bordures fines** sur toutes les cellules pour une meilleure lisibilite
4. **Ligne de titre** : nom du projet en haut du fichier, fusionne sur plusieurs colonnes
5. **Legende** en bas du tableau expliquant les couleurs
6. **Gel des volets** : les 5 premieres colonnes et la ligne d'en-tete restent visibles au scroll

## Modifications techniques

### 1. Ajouter la dependance `exceljs`

Installation du package `exceljs` (compatible navigateur, ~200 Ko gzippe).

### 2. Reecrire `src/utils/ganttExcelExport.ts`

Remplacement complet du contenu en utilisant l'API ExcelJS :

- **Workbook/Worksheet** : creation via `new ExcelJS.Workbook()` au lieu de `XLSX.utils`
- **Ligne titre** : cellule A1 fusionnee avec le nom du projet, police 14pt gras
- **En-tetes** : fond `#4B5563` (gris fonce), texte blanc, gras
- **Cellules Gantt** : `cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }` pour les cellules actives
- **Colonne Avancement** : barre de progression textuelle ou pourcentage colore
- **Legende** : 3 lignes en bas avec un carre de couleur + libelle
- **Gel des volets** : `worksheet.views = [{ state: 'frozen', xSplit: 5, ySplit: 2 }]`
- **Telechargement** : `workbook.xlsx.writeBuffer()` puis creation d'un Blob pour le download cote navigateur

### 3. Aucune modification d'interface

Le bouton "Export Gantt Excel" dans `TaskGantt.tsx` appelle deja `exportGanttToExcel(ganttTasks, projectTitle)`. La signature de la fonction reste identique, donc aucune modification de composant n'est necessaire.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `package.json` | Ajout de la dependance `exceljs` |
| `src/utils/ganttExcelExport.ts` | Reecriture complete avec ExcelJS et mise en forme avancee |

## Compatibilite

- ExcelJS fonctionne cote navigateur via `writeBuffer()` (pas besoin de Node.js)
- La bibliotheque `xlsx` reste utilisee par les autres exports du projet (taches, activites, permissions, etc.) et n'est pas supprimee
- Le fichier genere est compatible Excel, LibreOffice et Google Sheets

