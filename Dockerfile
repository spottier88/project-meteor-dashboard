# Étape 1 : Construction de l'application
FROM node:18 AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration et de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le reste des fichiers du projet
COPY . .

# Définition d'un argument pour choisir le bon fichier de connexion à la base
ARG ENV=dev

# Copier le fichier approprié en fonction de l'environnement
COPY src/integrations/supabase/client_${ENV}.ts src/integrations/supabase/client.ts

# Définition des variables avant le build
#ENV VITE_SUPABASE_URL=https://meteor.famillepottier.fr
#ENV VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM2NDYzNjAwLAogICJleHAiOiAxODk0MjMwMDAwCn0.Mw5JSVXI_frTAM1esPMePHAz5EjbvTLXyz0Zl-TGYkw

ENV VITE_SUPABASE_URL=https://apimeteor
ENV VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM4Nzk2NDAwLAogICJleHAiOiAxODk2NTYyODAwCn0.0YbTTYdQAusIT2EPAHNjpS9vhiLlwafEfCVVotZQGXs


# Construire l'application
RUN npm run build

# Étape 2 : Serveur pour le frontend
FROM nginx:stable-alpine

# Copier les fichiers de build générés dans Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier un fichier de configuration Nginx personnalisé (optionnel)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port par défaut de Nginx
EXPOSE 80

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
