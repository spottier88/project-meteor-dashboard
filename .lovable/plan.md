
# Correction : Liaison projets-portefeuilles dans le formulaire projet

## Diagnostic

Deux problèmes identifiés dans le flux de gestion des portefeuilles depuis le formulaire projet :

### Probleme 1 : Chargement (useProjectFormState.tsx, ligne 302-303)

Le code actuel charge uniquement l'ancien champ `project.portfolio_id` (colonne simple sur la table `projects`) :
```typescript
setPortfolioIds(project.portfolio_id ? [project.portfolio_id] : []);
```
Or, la relation multi-portefeuilles utilise la table de liaison `portfolio_projects`. Ce champ est donc vide ou obsolete.

### Probleme 2 : Sauvegarde (useProjectSubmit.tsx)

Le fichier `useProjectSubmit.tsx` ne contient **aucun code** pour inserer ou mettre a jour les enregistrements dans `portfolio_projects`. Les `portfolioIds` du formulaire sont ignores lors de la soumission.

---

## Corrections a apporter

### 1. Charger les portefeuilles depuis portfolio_projects

**Fichier** : `src/components/form/useProjectFormState.tsx`

Remplacer la ligne 302-303 :
```typescript
// AVANT
setPortfolioIds(project.portfolio_id ? [project.portfolio_id] : []);
```

Par une requete vers `portfolio_projects` :
```typescript
// APRES - Charger les portefeuilles depuis la table de liaison
try {
  const { data: portfolioLinks } = await supabase
    .from("portfolio_projects")
    .select("portfolio_id")
    .eq("project_id", project.id);
  
  setPortfolioIds(portfolioLinks?.map(p => p.portfolio_id) || []);
} catch (error) {
  console.error("Erreur chargement portefeuilles:", error);
  setPortfolioIds([]);
}
```

### 2. Sauvegarder les portefeuilles lors de la soumission

**Fichier** : `src/hooks/useProjectSubmit.tsx`

Ajouter la gestion des portefeuilles dans les deux branches (creation et mise a jour) :

#### Pour la mise a jour (apres la gestion du monitoring, vers ligne 135) :

```typescript
// Gestion des portefeuilles multi-selection
if (formState.portfolioIds !== undefined) {
  // Recuperer les portefeuilles actuels
  const { data: currentLinks } = await supabase
    .from("portfolio_projects")
    .select("portfolio_id")
    .eq("project_id", project.id);
  
  const currentIds = currentLinks?.map(l => l.portfolio_id) || [];
  const toAdd = formState.portfolioIds.filter(id => !currentIds.includes(id));
  const toRemove = currentIds.filter(id => !formState.portfolioIds.includes(id));

  if (toAdd.length > 0) {
    await supabase
      .from("portfolio_projects")
      .insert(toAdd.map(portfolioId => ({
        project_id: project.id,
        portfolio_id: portfolioId,
        added_by: formState.ownerId || null
      })));
  }

  if (toRemove.length > 0) {
    await supabase
      .from("portfolio_projects")
      .delete()
      .eq("project_id", project.id)
      .in("portfolio_id", toRemove);
  }
}
```

#### Pour la creation (apres la gestion du framing, vers ligne 207) :

```typescript
// Ajouter le projet aux portefeuilles selectionnes
if (formState.portfolioIds.length > 0) {
  const { error: portfolioError } = await supabase
    .from("portfolio_projects")
    .insert(formState.portfolioIds.map(portfolioId => ({
      project_id: projectId,
      portfolio_id: portfolioId,
      added_by: formState.ownerId || null
    })));

  if (portfolioError) {
    console.error("Erreur ajout portefeuilles:", portfolioError);
  }
}
```

#### Invalider les caches portefeuilles (apres les invalidations existantes, vers ligne 231) :

```typescript
await queryClient.invalidateQueries({ queryKey: ["project-portfolios"] });
await queryClient.invalidateQueries({ queryKey: ["portfolios"] });
await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
```

---

## Resume des fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/form/useProjectFormState.tsx` | Charger les portefeuilles depuis `portfolio_projects` au lieu de `project.portfolio_id` |
| `src/hooks/useProjectSubmit.tsx` | Ajouter la logique d'insertion/suppression dans `portfolio_projects` a la creation et mise a jour |

## Tests recommandes

1. **Creation** : Creer un projet en selectionnant 2 portefeuilles, verifier qu'ils apparaissent dans les portefeuilles concernes
2. **Edition** : Rouvrir le projet, verifier que les portefeuilles sont pre-selectionnes
3. **Modification** : Retirer un portefeuille et en ajouter un autre, verifier la mise a jour
4. **Sans portefeuille** : Creer/modifier un projet sans portefeuille, verifier qu'aucune erreur ne se produit
