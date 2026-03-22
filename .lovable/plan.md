# Visibilité des modèles de projet par entité organisationnelle

## Contexte

Actuellement, tous les modèles de projet (`project_templates`) sont visibles par tous les utilisateurs. L'objectif est de restreindre leur visibilité en fonction de l'entité organisationnelle du chef de projet, avec héritage hiérarchique (Pôle → Direction → Service).

## Règles de gestion

- Un modèle peut être affecté à plusieurs entités organisationnelles (pôle, direction, service).
- L'affectation à un pôle rend le modèle accessible aux directions et services de ce pôle.
- L'affectation à une direction rend le modèle accessible aux services de cette direction
- Si aucune affectation, le modèle est visible par tous.
- Lors de la création/modification d'un projet, seuls les modèles accessibles au chef de projet sont affichés.

## Modifications

### 1. Migration SQL — table de liaison + fonction d'accès

Créer la table `project_template_visibility` :

```sql
CREATE TABLE project_template_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES project_templates(id) ON DELETE CASCADE NOT NULL,
  entity_type user_hierarchy_level NOT NULL, -- 'pole', 'direction', 'service'
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, entity_type, entity_id)
);
ALTER TABLE project_template_visibility ENABLE ROW LEVEL SECURITY;
-- Admins only
CREATE POLICY "Admins manage template visibility"
  ON project_template_visibility FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

Créer une fonction `get_accessible_templates(p_user_id uuid)` (SECURITY DEFINER) :

- Récupère l'entité de l'utilisateur via `user_hierarchy_assignments`.
- Retourne les templates qui n'ont aucune affectation OU dont au moins une affectation correspond à l'entité de l'utilisateur (avec héritage hiérarchique via `hierarchy_paths`).

### 2. UI Admin — gestion des affectations organisationnelles

**Fichier** : `src/pages/ProjectTemplateManagement.tsx` (ou nouveau composant enfant)

- Dans la liste des modèles, ajouter une colonne/badge indiquant les entités affectées (ou "Tous" si aucune).
- Sur chaque modèle, ajouter un bouton "Visibilité" ouvrant un Dialog permettant de cocher/décocher des entités organisationnelles (sélecteur hiérarchique Pôle > Direction > Service, multi-sélection).

**Nouveau composant** : `src/components/templates/TemplateVisibilityDialog.tsx`

- Charge les pôles/directions/services.
- Charge les affectations existantes du template.
- Permet l'ajout/suppression d'affectations via `project_template_visibility`.

### 3. Filtrage des modèles côté formulaire projet

**Fichier** : `src/hooks/useProjectTemplates.tsx`

- Modifier la query `projectTemplates` pour appeler `get_accessible_templates(userId)` via RPC au lieu de `select('*')` sur `project_templates`.
- Le hook reçoit en paramètre optionnel l'userId du chef de projet sélectionné (pour filtrer en fonction de son entité).

**Fichier** : `src/components/form/ProjectFormStep5.tsx`

- Passer le `projectManager` (email) au hook pour déterminer l'userId et filtrer les templates accessibles.
- Quand le chef de projet change dans le formulaire, les templates disponibles se rafraîchissent.

### 4. Contexte admin

- En page admin (`ProjectTemplateManagement`), continuer à afficher tous les modèles (pas de filtrage par visibilité).

## Fichiers impactés


| Fichier                                                 | Modification                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Migration SQL                                           | Table `project_template_visibility` + fonction RPC `get_accessible_templates` |
| `src/components/templates/TemplateVisibilityDialog.tsx` | Nouveau — dialog de gestion des affectations                                  |
| `src/pages/ProjectTemplateManagement.tsx`               | Bouton visibilité + badges entités                                            |
| `src/hooks/useProjectTemplates.tsx`                     | Filtrage via RPC selon le chef de projet                                      |
| `src/components/form/ProjectFormStep5.tsx`              | Passage du chef de projet pour filtrer les templates                          |
