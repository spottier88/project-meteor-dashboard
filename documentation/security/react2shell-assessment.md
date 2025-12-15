# Évaluation de l'alerte CERTFR-2025-ACT-053 (React2Shell)

## Contexte
L'alerte CERT-FR (React2Shell) cible une vulnérabilité d'exécution de code à distance dans les React Server Components/Functions (CVE-2025-55182). Les systèmes affectés incluent notamment :
- `react-server-dom-webpack`, `react-server-dom-parcel`, `react-server-dom-turbopack` < versions correctives 19.0.1 / 19.1.2 / 19.2.1.
- Next.js 14 canary, 15.0.x < 15.0.5, 15.1.x < 15.1.9, 15.2.x < 15.2.6, 15.3.x < 15.3.6, 15.4.x < 15.4.8, 15.5.x < 15.5.7, 16.0.x < 16.0.7.
- React Router avec support RSC non corrigé, Expo/Waku/Redwood ou Vite avec plugin RSC utilisant `react-server-dom-*` vulnérables.

## Analyse de la base de code
- Le projet est une application Vite/React classique (SPA côté client). Les dépendances principales sont `react` et `react-dom` en version 18.2.0 (React 18 ne propose pas RSC/RSF par défaut) et `react-router-dom` 6.11.2 pour le routage.
- Aucun framework ou plugin orienté React Server Components n'est présent :
  - Pas de dépendances `react-server-dom-*`.
  - Pas de Next.js, Expo, Redwood, Waku ou Vite plugin RSC.
- La configuration Vite (vite.config.ts) utilise `@vitejs/plugin-react-swc`, sans activation d'options RSC.

## Conclusion
D'après l'inventaire des dépendances et la configuration actuelle, l'application **n'implémente pas les React Server Components/Functions** et **n'utilise aucun des paquets ou frameworks listés comme vulnérables**. Elle n'est donc **pas concernée par l'alerte CERTFR-2025-ACT-053 (React2Shell)** dans son état actuel.

## Recommandations
- Surveiller les mises à jour de React Router et de l'écosystème Vite/React, au cas où un support RSC serait activé ultérieurement.
- Conserver une veille sécurité : si l'application migre vers React 19 ou un framework RSC (Next.js, plugin RSC Vite), utiliser immédiatement les versions corrigées (`react-server-dom-*` ≥ 19.0.1/19.1.2/19.2.1 ; Next.js ≥ 15.0.5/15.1.9/15.2.6/15.3.6/15.4.8/15.5.7/16.0.7) et suivre les avis éditeurs.
