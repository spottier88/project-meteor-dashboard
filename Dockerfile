# Étape 1 : Construction de l'application
FROM node:18 AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration et de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY . .

# Définition des variables avant le build
ENV VITE_SUPABASE_URL="https://rgfabywkwllxoqsahrpt.supabase.co"
ENV VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZmFieXdrd2xseG9xc2FocnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwMzExMjUsImV4cCI6MjA1MDYwNzEyNX0.aAbMpn2Hq1vLQrh2XINRiEJIYng8lG4yBV_lSogf1MU"

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
