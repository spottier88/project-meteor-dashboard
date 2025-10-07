# Bienvenue sur le projet METEOR (pour Météo Projet)

Cette application est une gestion de projet simplifiée permettant de :
- saisir un projet
- suivre l'avancement des tâches
- établir la liste des risques
- réaliser des revues de projet périodiques
- Suivre les activités d'utilisateurs
- Gérer des portefeuilles de projet
- Gérer un panier de projet afin de pouvoir facilement exporter des données au format XLS ou PPTX.
- Gestion des portefeuilles de projets
- Note de cadrage assistée par l'IA

L'application dispose de plusieurs rôles pour les utilisateurs :
- Administrateur : il a tous les droits dans l'application
- Chef de projet : il peut créer des projets, les modifier (dans toutes ses composantes) dés lors qu'il en est le chef de projet
- Manager : il peut voir et gérer les projets affectés à l'organisation à laquelle il est affecté comme manager
- Suivi d'activités : l'utilisateur peut gérer ses activités (ajout, modification, import)
- Gestionnaire de portefeuille : peut ajouter, modifier ses portefeuilles de projets. ajout de projet et consultation des statistiques sur le portefeuille.

Ce projet est exclusivement développé avec la plateforme lovable (via IA) et une base de données POSTGRES acessible via supabase (en mode autohébergée)



## Les technologies utilisées par ce projet sont ?

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (pour la base de données, RLS, APi)

## Project info

**URL**: https://lovable.dev/projects/43774b00-8c33-4464-90db-40c5bcf5157e

## How can I edit this code?

There are several ways of editing your application.


## Déploiement du projet ?

Publication du dockerHub après chaque commit valide.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/43774b00-8c33-4464-90db-40c5bcf5157e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.




