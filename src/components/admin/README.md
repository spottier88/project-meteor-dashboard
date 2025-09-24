# Implémentation du Mode Admin On/Off - Documentation

## Vue d'ensemble

L'application dispose maintenant d'un système permettant aux administrateurs de désactiver temporairement leurs privilèges admin via un switch dans l'interface utilisateur. Cette fonctionnalité permet aux admins de "voir l'application" comme un utilisateur normal pour tester l'expérience utilisateur.

## Architecture

### 1. Contexte des Permissions (`src/contexts/PermissionsContext.tsx`)

Nouvelles propriétés ajoutées :
- `hasAdminRole`: Indique si l'utilisateur a réellement le rôle admin en base
- `adminRoleDisabled`: État du switch (true = admin désactivé)
- `toggleAdminRole()`: Fonction pour basculer le switch
- `isAdmin`: Maintenant calculé comme `hasAdminRole && !adminRoleDisabled`
- `canAccessAllOrganizations`: Maintenant calculé comme `isAdmin`

### 2. Hook Principal (`src/hooks/useAdminModeAwareData.ts`)

Hook centralisé fournissant :
- `effectiveAdminStatus`: Statut admin effectif
- `shouldUseAdminMode`: Indique si utiliser les privilèges admin
- `adminModeDisabled`: Valeur pour les fonctions RPC
- `hasAdminRole`: Vrai rôle admin
- `adminRoleDisabled`: État du switch

### 3. Fonction RPC Backend

Nouvelle fonction `get_accessible_projects_list_view_with_admin_mode` :
- Prend en paramètre `p_admin_mode_disabled`
- Ignore les privilèges admin si le mode est désactivé
- Filtre les projets selon les permissions non-admin quand nécessaire

## Hooks Adaptés

Tous les hooks de permissions ont été mis à jour pour utiliser `useAdminModeAwareData` :

- `useProjectsListView` - Données des projets
- `useDashboardData` - Données du tableau de bord
- `useProjectPermissions` - Permissions sur les projets
- `useReviewAccess` - Accès aux revues
- `useRiskAccess` - Accès aux risques
- `useTaskAccess` - Accès aux tâches
- `usePortfolioPermissions` - Permissions des portefeuilles
- Et tous les autres hooks `use-*-permissions.tsx`

## Interface Utilisateur

### Switch Admin (`src/components/UserInfo.tsx`)

- Affiché uniquement si `hasAdminRole === true`
- Position : à côté des notifications dans la barre d'utilisateur
- Libellé dynamique : "Mode admin" avec switch ON/OFF
- État visuel : Texte utilisateur montre "Administrateur (désactivé)" quand désactivé

## Comportement

### Mode Admin Activé (défaut)
- L'admin voit tous les projets
- Accès à toutes les fonctionnalités admin
- Navigation admin disponible
- Sélecteurs d'organisation complets

### Mode Admin Désactivé
- L'admin voit seulement ses projets personnels (chef de projet, membre, manager)
- Pas d'accès aux fonctions admin
- Navigation admin masquée
- Sélecteurs d'organisation limités selon les affectations

## Cohérence Serveur-Client

- Les fonctions RPC filtrent côté serveur selon le paramètre `admin_mode_disabled`
- Les hooks côté client utilisent le même état pour l'affichage
- Pas de sur-chargement de données inutiles
- Expérience utilisateur authentique

## Avantages

1. **Test UX** : Les admins peuvent tester l'expérience utilisateur normale
2. **Validation d'accès** : Vérifier que les restrictions fonctionnent correctement
3. **Formation** : Montrer l'interface utilisateur sans privilèges
4. **Sécurité** : Aucune modification permanente des rôles
5. **Performance** : Filtrage côté serveur évite le sur-chargement de données

## Sécurité

- Aucune modification des rôles réels en base de données
- Fonctionnalité uniquement côté session React
- L'admin garde ses vrais privilèges en base
- Réversible instantanément via le switch

## Migration des Composants

Les composants utilisant `isAdmin` doivent maintenant :
1. Importer `useAdminModeAwareData`
2. Utiliser `effectiveAdminStatus` au lieu de `isAdmin` direct
3. Ou utiliser le nouveau hook `useAdminModeAwarePermissions` pour une interface unifiée

## Tests

Pour tester la fonctionnalité :
1. Se connecter en tant qu'admin
2. Vérifier l'accès complet
3. Désactiver le mode admin via le switch
4. Vérifier que l'interface se limite selon les autres rôles de l'utilisateur
5. Réactiver le mode admin
6. Vérifier le retour à l'accès complet