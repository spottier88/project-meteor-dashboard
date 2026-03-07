

# Ajout des indicateurs de réussite au cadrage projet

## Objectif
Ajouter un champ textuel "Indicateurs de réussite" (`success_indicators`) à la note de cadrage, intégré dans le formulaire, la vue détaillée, la génération IA et la sauvegarde en base.

## Modifications

### 1. Migration base de données
Ajouter une colonne `success_indicators` (text, nullable) à la table `project_framing` :
```sql
ALTER TABLE project_framing ADD COLUMN success_indicators text;
```

### 2. Fichier `src/utils/framingAIHelpers.ts`
- Ajouter `'success_indicators'` au type `FramingSectionKey`
- Ajouter `'indicateurs'` au type `AITemplateSectionKey`
- Ajouter l'entrée dans `FRAMING_SECTION_MAPPING` :
  - label: "Indicateurs de réussite"
  - aiSection: `'indicateurs'`
  - placeholder: "Définissez les indicateurs permettant de mesurer le succès du projet"

### 3. Fichier `src/components/form/useProjectFormState.tsx`
- Ajouter le state `successIndicators` / `setSuccessIndicators` dans l'interface `ProjectFormState` et dans le hook
- Charger la valeur depuis `framingData.success_indicators` en mode édition

### 4. Fichier `src/components/form/ProjectFormStep4.tsx`
- Ajouter les props `successIndicators` / `setSuccessIndicators`
- Ajouter le `FramingField` pour `success_indicators` (après les objectifs ou les livrables)
- Intégrer dans les setters/currentValues pour la génération IA

### 5. Fichier `src/components/form/ProjectFormContent.tsx`
- Passer les nouvelles props `successIndicators` / `setSuccessIndicators` au Step 4

### 6. Fichier `src/utils/projectSubmitHelpers.ts`
- Ajouter `success_indicators: formState.successIndicators` dans le payload de `saveFraming`
- Ajouter dans la condition `hasFramingData`

### 7. Fichier `src/components/framing/FramingDetails.tsx`
- Ajouter `{ title: "Indicateurs de réussite", key: "success_indicators" }` dans le tableau `sections`

### 8. Fichier `src/components/framing/FramingSectionEditor.tsx`
- Le composant est générique, pas de modification nécessaire (il utilise la clé dynamiquement)

### 9. Template IA (optionnel, en base)
- Insérer un template dans `ai_prompt_templates` avec `section = 'indicateurs'`, `type = 'framework_note'` pour guider la génération IA de cette section. Sans ce template, le fallback générique sera utilisé.

## Fichiers impactés
| Fichier | Modification |
|---------|-------------|
| Migration SQL | Ajout colonne `success_indicators` |
| `framingAIHelpers.ts` | Types + mapping |
| `useProjectFormState.tsx` | State + chargement |
| `ProjectFormStep4.tsx` | Props + champ + IA |
| `ProjectFormContent.tsx` | Passage des props |
| `projectSubmitHelpers.ts` | Sauvegarde |
| `FramingDetails.tsx` | Affichage en lecture |

