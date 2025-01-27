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
