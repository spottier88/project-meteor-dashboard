

# Plan : Wizard "Mode Assisté" — questions guidées pas à pas

## Concept

Un bouton "Mode assisté" dans le header du formulaire projet bascule vers un parcours séquentiel affichant **une question (ou un petit groupe de 2-3 champs cohérents) par écran**, style Typeform. Barre de progression en haut, navigation Précédent/Suivant, récapitulatif final avant soumission.

Pas d'IA. On réutilise le `formState` existant et les composants de saisie existants (Select, DateInputField, LifecycleStatusButtons, etc.).

---

## Découpage en micro-étapes

Les 5 onglets actuels (28+ champs) sont réorganisés en **10 micro-étapes** de 1-3 champs chacune, regroupées par cohérence :

| Etape | Question / Titre | Champs |
|-------|-----------------|--------|
| 1 | "Comment s'appelle votre projet ?" | `title` + `description` |
| 2 | "Qui pilote ce projet ?" | `projectManager` (sélecteur existant) |
| 3 | "Quelles sont les dates prévisionnelles ?" | `startDate` + `endDate` |
| 4 | "Quel est le statut et la priorité ?" | `lifecycleStatus` (boutons) + `priority` |
| 5 | "Rattachement organisationnel" | `portfolioIds` + `tags` + `teamsUrl` |
| 6 | "Niveau de suivi" | `monitoringLevel` (auto-déduit de l'org du chef de projet) |
| 7 | "Score d'innovation" | Les 5 sliders + radar chart |
| 8 | "Cadrage du projet" | Les 7 champs texte (contexte, objectifs, etc.) avec boutons IA |
| 9 | "Entité bénéficiaire et modèle" | `forEntityType`/`forEntityId` + `templateId` |
| 10 | **Récapitulatif** | Vue synthétique de toutes les données, bouton "Créer" |

Les étapes 6 à 9 sont marquées **optionnelles** (l'utilisateur peut les sauter).

---

## Architecture technique

### Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `src/components/form/assisted/AssistedProjectWizard.tsx` | Conteneur principal du wizard |
| `src/components/form/assisted/AssistedStep.tsx` | Layout d'une micro-étape (titre, sous-titre, contenu, navigation) |
| `src/components/form/assisted/AssistedStepConfig.ts` | Configuration des 10 étapes (titre, sous-titre, champs, optionnel) |
| `src/components/form/assisted/AssistedRecap.tsx` | Récapitulatif final (étape 10) |

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/components/form/ProjectFormHeader.tsx` | Ajout toggle "Mode classique / Mode assisté" |
| `src/components/form/ProjectFormContent.tsx` | Si mode assisté, rendre `AssistedProjectWizard` au lieu des steps classiques |
| `src/components/form/useProjectFormState.tsx` | Ajout d'un état `isAssistedMode` + setter |
| `src/components/ProjectForm.tsx` | Adapter la navigation (le wizard gère ses propres étapes) |

### Principes d'implémentation

- **Le `formState` reste identique** : le wizard utilise les mêmes setters (`setTitle`, `setDescription`, etc.). Pas de duplication d'état.
- **`AssistedStep`** : composant layout qui affiche un titre centré, un sous-titre explicatif, le contenu (champ de saisie), et les boutons Précédent/Suivant/Passer.
- **Chaque étape réutilise les composants existants** : `Input`, `Textarea`, `ProjectManagerDialog`, `DateInputField`, `LifecycleStatusButtons`, sliders du Step3, `FramingField` du Step4, etc.
- **Barre de progression** : simple `Progress` en haut indiquant étape X/10.
- **Bouton "Passer"** sur les étapes optionnelles (6-9) pour avancer sans remplir.
- **Basculement** : à tout moment, l'utilisateur peut revenir en mode classique (les données saisies sont conservées car c'est le même `formState`).
- **Récapitulatif** (étape 10) : affiche les données sous forme de sections résumées avec possibilité de cliquer sur une section pour revenir à l'étape correspondante.

---

## Expérience utilisateur

```text
┌─────────────────────────────────────────────┐
│  Nouveau projet    [Classique] [● Assisté]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ██████████░░░░░░░░░░░░░░░  Étape 4/10      │
│                                             │
│                                             │
│     Quel est le statut et la priorité ?     │
│     Définissez l'avancement et l'urgence    │
│                                             │
│     [À l'étude] [Validé] [En cours] ...     │
│                                             │
│     Priorité :  [Basse] [Moyenne] [Haute]   │
│                                             │
│                                             │
│  [← Précédent]              [Suivant →]     │
└─────────────────────────────────────────────┘
```

