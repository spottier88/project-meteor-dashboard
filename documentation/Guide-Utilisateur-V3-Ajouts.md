# METEOR - Guide Utilisateur V3
## Nouvelles sections à intégrer

**Version** : V3  
**Date** : 09/01/2026  
**Nouveautés** : Gestion des portefeuilles de projet, Clôture et évaluation des projets

---

# Mise à jour de la section "Profils utilisateurs" (page 3)

Compléter le tableau des profils avec la description enrichie :

| Profil | Description |
|--------|-------------|
| Gestionnaire de portefeuille | Création et gestion de portefeuilles de projets. Organisation des revues périodiques. Suivi consolidé de plusieurs projets. Export des données au format Excel et PowerPoint. Accès aux projets du portefeuille en lecture. |

---

# 7. Gestion des portefeuilles de projet

## 7.1 Présentation

Un **portefeuille de projet** permet de regrouper plusieurs projets partageant des objectifs stratégiques communs. Cette fonctionnalité offre une vision consolidée et facilite le pilotage transversal.

**Fonctionnalités principales :**
- Vision consolidée de l'avancement de plusieurs projets
- Définition d'objectifs stratégiques et d'un budget global
- Organisation de revues de projets périodiques
- Suivi statistique (répartition par météo, cycle de vie, avancement moyen)
- Export des synthèses au format Excel ou PowerPoint

---

## 7.2 Accès aux portefeuilles

L'accès aux portefeuilles s'effectue :
- Via le **menu principal** : cliquer sur "Portefeuilles"
- Via le **tableau de bord** : section "Mes portefeuilles" (si vous êtes gestionnaire d'au moins un portefeuille)

**Conditions d'accès :**
- Les administrateurs voient tous les portefeuilles
- Les gestionnaires de portefeuille voient les portefeuilles dont ils sont propriétaires ou gestionnaires
- Les chefs de projet peuvent voir les portefeuilles contenant leurs projets

---

## 7.3 Création d'un portefeuille

Pour créer un nouveau portefeuille :

1. Accéder à la page "Portefeuilles"
2. Cliquer sur le bouton **"Créer un portefeuille"**
3. Renseigner les informations demandées :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Nom | Oui | Nom du portefeuille |
| Description | Non | Description détaillée du portefeuille |
| Objectifs stratégiques | Non | Les objectifs stratégiques visés |
| Budget total | Non | Enveloppe budgétaire globale en euros |
| Date de début | Non | Date de démarrage du portefeuille |
| Date de fin | Non | Date de fin prévisionnelle |
| Statut | Non | Actif, Suspendu ou Terminé |

4. Cliquer sur **"Créer"** pour valider

---

## 7.4 Détails d'un portefeuille

En cliquant sur un portefeuille, vous accédez à sa page de détail qui présente **4 onglets** :

### Onglet "Vue d'ensemble"

Cet onglet affiche les statistiques consolidées du portefeuille :
- **Graphique de répartition par météo** : nombre de projets ensoleillés, nuageux et orageux
- **Graphique de répartition par cycle de vie** : projets à l'étude, validés, en cours, terminés, suspendus, abandonnés
- **Indicateurs clés** : nombre de projets, avancement moyen, budget total

### Onglet "Projets"

Cet onglet liste tous les projets du portefeuille avec :
- Titre du projet
- Chef de projet
- Météo actuelle
- Cycle de vie
- Avancement (%)

**Actions disponibles** (selon vos droits) :
- **Ajouter des projets** : bouton "Ajouter des projets" pour sélectionner des projets existants
- **Retirer un projet** : cliquer sur l'icône de suppression à côté du projet

> **Note** : Un projet peut appartenir à plusieurs portefeuilles simultanément.

### Onglet "Revues de projets"

Cet onglet permet d'organiser et suivre les revues périodiques des projets du portefeuille (voir section 7.5).

### Onglet "Gestionnaires"

Cet onglet liste les utilisateurs ayant accès au portefeuille et permet de gérer les permissions :
- Voir la liste des gestionnaires et leur rôle
- Ajouter un nouveau gestionnaire
- Modifier le rôle d'un gestionnaire
- Retirer un gestionnaire

---

## 7.5 Organisation des revues de projets

La fonctionnalité **"Organiser les revues"** permet de demander aux chefs de projet de mettre à jour leurs projets avant une date donnée.

### Créer une demande de revue

1. Dans l'onglet "Revues de projets", cliquer sur **"Organiser les revues"**
2. Renseigner :
   - **Sujet** : titre de la revue (ex: "Revue trimestrielle T1 2026")
   - **Date d'échéance** : date limite pour réaliser les revues
   - **Notes** (optionnel) : instructions complémentaires pour les chefs de projet
3. Cliquer sur **"Créer"**

### Notifier les chefs de projet

Une fois la revue créée, vous pouvez envoyer une notification par email aux chefs de projet :

1. Cliquer sur l'icône d'envoi (enveloppe) à côté de la revue
2. Personnaliser le message si nécessaire
3. Confirmer l'envoi

Les chefs de projet recevront un email les invitant à mettre à jour leurs projets.

### Suivre l'avancement des revues

Le tableau des revues affiche :
- Le sujet de la revue
- La date d'échéance
- Le statut (planifiée, en cours, terminée)
- Les actions disponibles (modifier, notifier, supprimer)

### Diagramme de Gantt

Le bouton **"Gantt"** affiche un diagramme de Gantt des projets du portefeuille, permettant de visualiser leur planning sur une échelle temporelle.

---

## 7.6 Rôles dans un portefeuille

Les permissions dans un portefeuille sont gérées par rôles :

| Rôle | Consultation | Ajout/Retrait projets | Organisation revues | Gestion gestionnaires | Modification/Suppression |
|------|--------------|----------------------|---------------------|----------------------|-------------------------|
| **Propriétaire** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gestionnaire** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Membre** (chef de projet) | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Note** : Le propriétaire est l'utilisateur qui a créé le portefeuille. Ce rôle ne peut pas être transféré.

---

## 7.7 Export du portefeuille

Deux formats d'export sont disponibles depuis la page de détail du portefeuille :

### Export Excel

Cliquer sur le bouton **"Excel"** pour générer un fichier contenant :
- **Feuille 1 - Informations générales** : nom, description, objectifs, budget, dates
- **Feuille 2 - Statistiques** : répartition par météo et par cycle de vie
- **Feuille 3 - Liste des projets** : détail de chaque projet (titre, chef de projet, statut, dates, avancement)

### Export PowerPoint

Cliquer sur le bouton **"PowerPoint"** pour générer une présentation contenant :
- Slide de couverture avec le nom du portefeuille
- Slides de synthèse avec les graphiques
- Une slide par projet avec ses indicateurs clés

---

# 8. Clôture et évaluation des projets

## 8.1 Présentation

La **clôture d'un projet** est un processus structuré qui remplace le passage direct au statut "Terminé". Ce processus permet de :

- Formaliser la fin du projet avec un **bilan final**
- Évaluer la **méthodologie** et les pratiques utilisées
- **Capitaliser** sur les retours d'expérience pour les futurs projets

> **Important** : Le statut "Terminé" n'est plus accessible directement dans le sélecteur de cycle de vie. Un projet ne peut être marqué comme terminé qu'en passant par le processus de clôture.

---

## 8.2 Accès à la clôture

Le bouton **"Clôturer le projet"** est disponible :
- Sur la **page de synthèse** du projet
- À côté des boutons d'export (PPTX, Note de cadrage)

**Conditions d'accès :**
- Être **chef de projet** (principal ou secondaire) du projet
- Le projet ne doit **pas déjà être au statut "Terminé"**
- Le projet ne doit **pas être suspendu ou abandonné**

---

## 8.3 Les étapes de la clôture

Le processus de clôture comprend **4 étapes** successives :

| Étape | Nom | Description | Obligatoire |
|-------|-----|-------------|-------------|
| 1 | Introduction | Présentation du processus et de ses objectifs | - |
| 2 | Bilan du projet | Dernière revue avec météo finale et commentaire de clôture | Oui |
| 3 | Évaluation de la méthode | Évaluation des pratiques projet | Non (peut être reportée) |
| 4 | Confirmation | Récapitulatif et validation finale | Oui |

Une barre de progression en haut de la fenêtre indique votre avancement dans le processus.

---

## 8.4 Étape 1 : Introduction

Cette première étape présente :
- Les **objectifs** du processus de clôture
- Les **deux niveaux** d'évaluation (bilan projet et évaluation méthode)
- La possibilité de **reporter** l'évaluation de la méthode si nécessaire

Cliquer sur **"Commencer"** pour passer à l'étape suivante.

---

## 8.5 Étape 2 : Bilan du projet (Niveau 1)

Cette étape **obligatoire** correspond à la revue finale du projet.

### Champs à renseigner :

| Champ | Description |
|-------|-------------|
| **Météo finale** | État général du projet à sa conclusion (Ensoleillé, Nuageux, Orageux) |
| **Évolution** | Tendance par rapport à la dernière revue (En amélioration, Stable, En dégradation) |
| **Avancement** | Automatiquement fixé à 100% pour un projet terminé |
| **Commentaire de clôture** | Synthèse finale du projet : bilan global, résultats obtenus, points marquants |

### Conseils pour le commentaire de clôture :
- Résumer les **objectifs atteints** et les éventuels écarts
- Mentionner les **livrables** produits
- Indiquer les **difficultés majeures** rencontrées et comment elles ont été surmontées
- Préciser si des **actions de suivi** sont nécessaires

Cliquer sur **"Continuer"** pour passer à l'étape suivante.

---

## 8.6 Étape 3 : Évaluation de la méthode (Niveau 2)

Cette étape permet d'évaluer les pratiques méthodologiques utilisées pendant le projet.

### Évaluations quantitatives (échelle de 1 à 5) :

| Critère | Description |
|---------|-------------|
| **Planification** | Qualité de la planification initiale et de son suivi |
| **Communication** | Efficacité de la communication au sein de l'équipe et avec les parties prenantes |
| **Gestion des risques** | Pertinence de l'identification et du traitement des risques |
| **Atteinte des objectifs** | Niveau d'atteinte des objectifs initiaux du projet |

### Évaluations qualitatives :

| Champ | Description |
|-------|-------------|
| **Points forts** | Ce qui a bien fonctionné pendant le projet |
| **Points d'amélioration** | Les axes d'amélioration identifiés |
| **Leçons apprises** | Les enseignements à retenir pour les futurs projets |

### Option de report

Si vous n'êtes pas en mesure de compléter l'évaluation immédiatement, vous pouvez cliquer sur **"Reporter l'évaluation"**. Dans ce cas :
- Le projet sera tout de même clôturé (statut "Terminé")
- Un indicateur **"Évaluation en attente"** sera affiché sur la fiche projet
- Vous pourrez compléter l'évaluation ultérieurement

---

## 8.7 Étape 4 : Confirmation

Cette dernière étape affiche un **récapitulatif** des informations saisies :
- Météo finale et évolution
- Commentaire de clôture
- Évaluations de la méthode (si complétées)

Vérifiez les informations puis cliquez sur :
- **"Confirmer la clôture"** : pour finaliser le processus
- **"Retour"** : pour modifier les informations saisies

---

## 8.8 Évaluation en attente

Lorsqu'une évaluation a été reportée, le projet affiche un **badge orange "Évaluation en attente"** sur sa fiche de synthèse.

### Compléter une évaluation en attente

1. Accéder à la page de synthèse du projet
2. Cliquer sur le bouton **"Compléter l'évaluation"** (affiché à la place du bouton de clôture)
3. Renseigner les champs d'évaluation de la méthode
4. Confirmer pour finaliser l'évaluation

Une fois l'évaluation complétée, le badge "Évaluation en attente" disparaît.

---

## 8.9 Après la clôture

Une fois le projet clôturé :

| Élément | État |
|---------|------|
| **Statut** | Passe automatiquement à "Terminé" |
| **Date de clôture** | Enregistrée automatiquement |
| **Dernière revue** | Marquée comme "revue finale" |
| **Modifications** | Le projet reste consultable mais n'est plus modifiable |
| **Évaluations** | Enregistrées pour analyse et capitalisation |

> **Note** : Les projets clôturés restent visibles dans les listes et portefeuilles. Ils peuvent être filtrés par le statut "Terminé".

---

# Table des matières mise à jour

Ajouter les nouvelles sections à la table des matières existante :

```
7. Gestion des portefeuilles de projet .......................... XX
   7.1 Présentation ............................................. XX
   7.2 Accès aux portefeuilles .................................. XX
   7.3 Création d'un portefeuille ............................... XX
   7.4 Détails d'un portefeuille ................................ XX
   7.5 Organisation des revues de projets ....................... XX
   7.6 Rôles dans un portefeuille ............................... XX
   7.7 Export du portefeuille ................................... XX

8. Clôture et évaluation des projets ............................ XX
   8.1 Présentation ............................................. XX
   8.2 Accès à la clôture ....................................... XX
   8.3 Les étapes de la clôture ................................. XX
   8.4 Étape 1 : Introduction ................................... XX
   8.5 Étape 2 : Bilan du projet (Niveau 1) ..................... XX
   8.6 Étape 3 : Évaluation de la méthode (Niveau 2) ............ XX
   8.7 Étape 4 : Confirmation ................................... XX
   8.8 Évaluation en attente .................................... XX
   8.9 Après la clôture ......................................... XX
```

---

# Liste des captures d'écran recommandées

## Portefeuilles (7 captures)
1. `portfolio-list.png` - Liste des portefeuilles
2. `portfolio-create-form.png` - Formulaire de création
3. `portfolio-overview-tab.png` - Onglet Vue d'ensemble avec graphiques
4. `portfolio-projects-tab.png` - Onglet Projets
5. `portfolio-reviews-tab.png` - Onglet Revues de projets
6. `portfolio-managers-tab.png` - Onglet Gestionnaires
7. `portfolio-gantt.png` - Vue Gantt du portefeuille

## Clôture de projet (7 captures)
1. `closure-button.png` - Bouton "Clôturer le projet" sur la page de synthèse
2. `closure-step1-intro.png` - Étape 1 : Introduction
3. `closure-step2-review.png` - Étape 2 : Bilan du projet
4. `closure-step3-evaluation.png` - Étape 3 : Évaluation de la méthode
5. `closure-step4-confirmation.png` - Étape 4 : Confirmation
6. `closure-pending-badge.png` - Badge "Évaluation en attente"
7. `closure-complete-evaluation-button.png` - Bouton "Compléter l'évaluation"

---

*Document généré le 09/01/2026 - METEOR V3*
