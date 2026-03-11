

# Plan : Modèles d'export de note de cadrage (publipostage / mail merge)

## Concept

L'administrateur charge un ou plusieurs fichiers DOCX "modèles" contenant des balises de type `{{titre_projet}}`, `{{contexte}}`, etc. Lors de l'export, l'utilisateur choisit un modèle (ou "sans modèle" pour l'export actuel) et le système remplace les balises par les données du projet, produisant un DOCX fidèle à la charte graphique de l'organisation.

Le format PDF reste disponible sans modèle (génération programmatique actuelle). L'export DOCX avec modèle utilise la bibliothèque `docx-templates` (ou équivalent) pour effectuer le remplacement dans le fichier source.

---

## 1. Base de données

### Table `framing_export_templates`

```sql
CREATE TABLE framing_export_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_path text NOT NULL,        -- chemin dans le bucket Storage
  file_name text NOT NULL,        -- nom original du fichier
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**RLS** : SELECT pour tous les authentifiés ; INSERT/UPDATE/DELETE pour admins uniquement.

### Bucket Storage `framing-export-templates`

Bucket privé pour stocker les fichiers DOCX modèles. RLS : lecture pour authentifiés, écriture pour admins.

---

## 2. Balises disponibles dans les modèles

Les administrateurs pourront utiliser ces balises dans leur document DOCX :

| Balise | Donnée |
|--------|--------|
| `{{titre_projet}}` | Titre du projet |
| `{{code_projet}}` | Code projet |
| `{{chef_projet}}` | Nom du chef de projet |
| `{{etat}}` | Statut du cycle de vie |
| `{{date_debut}}` | Date de début |
| `{{date_fin}}` | Date de fin prévue |
| `{{organisation}}` | Pôle > Direction > Service |
| `{{description}}` | Description du projet |
| `{{priorite}}` | Priorité |
| `{{avancement}}` | % d'avancement |
| `{{contexte}}` | Section cadrage : contexte |
| `{{objectifs}}` | Section cadrage : objectifs |
| `{{parties_prenantes}}` | Section cadrage : parties prenantes |
| `{{gouvernance}}` | Section cadrage : gouvernance |
| `{{calendrier}}` | Section cadrage : calendrier |
| `{{livrables}}` | Section cadrage : livrables |
| `{{indicateurs_reussite}}` | Section cadrage : indicateurs |
| `{{equipe}}` | Liste des membres formatée |
| `{{risques}}` | Liste des risques formatée |
| `{{taches}}` | Liste des tâches formatée |
| `{{date_generation}}` | Date de génération du document |

---

## 3. Dépendance npm

Ajout de **`docxtemplater`** + **`pizzip`** pour lire le DOCX modèle, remplacer les balises et produire le fichier final. Ces bibliothèques fonctionnent côté client (browser).

---

## 4. Interface d'administration

### Page `/admin/framing-export-templates`

- Liste des modèles (titre, description, fichier, défaut, actif)
- Upload d'un nouveau modèle DOCX (file input + métadonnées titre/description)
- Remplacement du fichier d'un modèle existant
- Marquer un modèle comme "par défaut"
- Supprimer un modèle
- Affichage de la liste des balises disponibles (référence pour le créateur du modèle)

### Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `src/pages/FramingExportTemplateManagement.tsx` | Page admin |
| `src/components/framing-export-templates/ExportTemplateList.tsx` | Liste des modèles |
| `src/components/framing-export-templates/ExportTemplateDialog.tsx` | Dialog création/édition + upload |
| `src/components/framing-export-templates/AvailablePlaceholders.tsx` | Référence des balises |
| `src/hooks/useFramingExportTemplates.ts` | Hook CRUD react-query + supabase |

### Intégration admin

- Ajout d'un bouton dans `AdminDashboard.tsx` vers `/admin/framing-export-templates`
- Ajout de la route dans le routeur

---

## 5. Impact sur le dialogue d'export

### `FramingExportDialog.tsx` — modifications

Le dialogue actuel propose PDF ou DOCX. Il sera enrichi :

1. **Choix du format** (inchangé) : PDF / DOCX
2. **Si DOCX sélectionné** : afficher un sélecteur de modèle (Select) listant les modèles actifs + option "Sans modèle (export standard)"
3. Le callback `onExport` reçoit désormais `(format, templateId?)` au lieu de `(format)` seul

### `ProjectSummaryActions.tsx` — modifications

- `handleExportFraming` reçoit le `templateId` optionnel
- Si un `templateId` est fourni :
  1. Récupérer le fichier DOCX modèle depuis le bucket Storage
  2. Charger le fichier avec PizZip + Docxtemplater
  3. Construire l'objet de données (balises → valeurs) à partir de `ProjectData`
  4. Exécuter le remplacement et télécharger le résultat
- Sinon : appeler `generateProjectFramingDOCX` comme actuellement

---

## 6. Logique de remplacement (mail merge)

### Nouveau fichier `src/utils/framingMailMerge.ts`

```text
1. Télécharger le fichier modèle depuis Supabase Storage
2. Charger avec PizZip
3. Instancier Docxtemplater avec le zip
4. Construire les données :
   - Champs simples : titre, code, dates, etc.
   - Champs Markdown (contexte, objectifs...) : convertis en texte brut
     (Docxtemplater ne gère pas le rich text nativement)
   - Listes (équipe, risques, tâches) : formatées en texte lisible
5. Appeler render() puis générer le blob
6. Déclencher le téléchargement
```

> **Note** : Docxtemplater en version gratuite ne gère que le texte brut dans les balises. Le formatage Markdown (gras, listes) du contenu de cadrage sera aplati en texte. Pour du rich text dans les balises, il faudrait le module payant `docxtemplater-html-module`. On peut commencer en texte brut et évoluer si besoin.

---

## 7. Fichiers impactés (résumé)

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Table `framing_export_templates` + bucket Storage + RLS |
| `src/utils/framingMailMerge.ts` | **Nouveau** — logique de remplacement |
| `src/hooks/useFramingExportTemplates.ts` | **Nouveau** — hook CRUD |
| `src/pages/FramingExportTemplateManagement.tsx` | **Nouveau** — page admin |
| `src/components/framing-export-templates/*` | **Nouveau** — composants admin |
| `src/pages/AdminDashboard.tsx` | Ajout bouton "Modèles d'export" |
| `src/routes.tsx` | Ajout route |
| `src/components/framing/FramingExportDialog.tsx` | Ajout sélecteur de modèle (DOCX) |
| `src/components/project/ProjectSummaryActions.tsx` | Branchement mail merge |
| `package.json` | Ajout `docxtemplater` + `pizzip` |

