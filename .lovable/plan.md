
# Correction de l'affichage des evaluations pour les utilisateurs sans acces aux projets

## Probleme identifie

La politique RLS `evaluation_read_policy` sur `project_evaluations` accorde aux `quality_manager` l'acces a **toutes** les evaluations. Cependant, la jointure sur la table `projects` est elle-meme filtree par les politiques RLS de `projects`, qui n'incluent **pas** le role `quality_manager`. Resultat : les evaluations sont bien recuperees, mais les donnees du projet joint sont `null`, ce qui provoque l'affichage de lignes "Projet inconnu".

## Solution proposee

Deux corrections complementaires :

### 1. Filtrage client-side dans `useAllEvaluations.ts` (correction immediate)

Filtrer les evaluations dont le projet joint est `null` (donc inaccessible a l'utilisateur). Cela garantit qu'aucune ligne "Projet inconnu" n'apparait, quel que soit le role.

**Fichier** : `src/hooks/useAllEvaluations.ts`

Apres la recuperation des donnees, ajouter un filtre eliminant les evaluations sans donnees de projet :

```text
filteredData = filteredData.filter(e => e.project !== null);
```

Cela s'applique avant tous les autres filtres existants (pole, direction, recherche, etc.).

### 2. Mise a jour des statistiques dans `EvaluationsManagement.tsx`

Les compteurs en haut de page (Total, Lecons apprises, Ameliorations) refleteront automatiquement le bon nombre puisqu'ils se basent sur le tableau filtre retourne par le hook.

## Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useAllEvaluations.ts` | Ajouter `filteredData = filteredData.filter(e => e.project !== null)` apres la ligne 82, avant les filtres existants |

## Pourquoi ne pas modifier les politiques RLS de `projects` ?

Accorder aux `quality_manager` un acces SELECT global a tous les projets serait disproportionne : ce role est prevu pour la consultation des **evaluations**, pas pour l'acces complet aux donnees de projet. Filtrer cote client les lignes sans projet accessible est la solution la plus coherente avec le modele de permissions existant, et la securite reste assuree par les RLS en base.

## Impact

- Les lignes "Projet inconnu" disparaissent
- Les compteurs sont corrects
- Aucune modification de securite ou de schema de base
- Modification minimale (une ligne ajoutee)
