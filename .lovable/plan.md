

# Implementation des tags sur les projets

## Architecture

Utilisation d'une table de liaison many-to-many entre projets et tags, avec une table de reference pour les tags disponibles. Les tags sont des chaines libres (pas de referentiel pre-defini par un admin), gerees directement par les utilisateurs ayant les droits d'edition du projet.

## 1. Schema de base de donnees

### Table `project_tags`

```sql
CREATE TABLE public.project_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, tag)
);

ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

-- Lecture : memes droits que les projets (via can_access_project)
CREATE POLICY "Users can view project tags"
  ON public.project_tags FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_tags.project_id
    AND can_access_project(auth.uid(), p.id)
  ));

-- Ecriture : admin ou chef de projet (via can_manage_project)
CREATE POLICY "Users can manage project tags"
  ON public.project_tags FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_tags.project_id
    AND can_manage_project(auth.uid(), p.id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_tags.project_id
    AND can_manage_project(auth.uid(), p.id)
  ));
```

Pas de table de referentiel : les tags disponibles pour l'autocompletion seront simplement un `SELECT DISTINCT tag FROM project_tags ORDER BY tag`.

## 2. Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `src/hooks/useProjectTags.ts` | Hook pour charger les tags d'un projet, les tags existants (autocompletion), et les fonctions add/remove |
| `src/components/project/ProjectTagsInput.tsx` | Composant de saisie de tags (input avec autocompletion + badges cliquables pour suppression) |
| `src/components/project/ProjectTagsBadges.tsx` | Composant d'affichage en lecture seule des tags (badges colores) |

## 3. Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/form/BasicProjectFields.tsx` | Ajouter le composant `ProjectTagsInput` apres le champ priorite (necessite le `projectId` pour les projets existants, ou un state local pour les nouveaux projets) |
| `src/components/form/useProjectFormState.tsx` | Ajouter l'etat `tags: string[]` + `setTags` au form state, charger les tags existants a l'initialisation |
| `src/components/form/ProjectFormStep1.tsx` | Propager `tags`/`setTags` vers `BasicProjectFields` |
| `src/hooks/useProjectSubmit.tsx` | Apres creation/mise a jour du projet, synchroniser les tags (supprimer les anciens, inserer les nouveaux) |
| `src/components/project/ProjectSummaryHeader.tsx` | Afficher les tags du projet sous forme de badges colores sous la description |
| `src/components/project/ProjectFilters.tsx` | Ajouter un filtre par tag (multi-select ou input texte) |
| `src/pages/Index.tsx` | Ajouter l'etat `selectedTags` et propager le filtre, filtrer les projets cote client |
| `src/hooks/useProjectsListView.ts` | Optionnel : enrichir `ProjectListItem` avec un champ `tags` si la RPC le permet, sinon charger separement |

## 4. Comportement detaille

### Saisie des tags (formulaire projet)
- Champ texte avec autocompletion basee sur les tags existants dans la base
- Touche Entree ou virgule pour valider un tag
- Affichage des tags saisis sous forme de badges avec bouton X pour supprimer
- Tags stockes dans le form state, synchronises a la sauvegarde du projet

### Affichage synthese projet
- Badges colores affiches sous la description dans `ProjectSummaryHeader`
- Couleur generee automatiquement a partir du hash du tag (pour coherence visuelle)

### Filtre par tag (liste des projets)
- Ajout d'un champ de filtre dans le panneau de filtres existant
- Filtrage cote client : un projet correspond si au moins un de ses tags est dans la selection
- Badge actif affiche dans la barre de filtres resume

## 5. Impact

- Aucune modification des tables existantes
- Nouvelle table `project_tags` avec RLS alignee sur les droits projets
- Integration dans le flux existant du formulaire projet (etape 1)
- Recherche textuelle existante inchangee (le filtre tag est additionnel)

