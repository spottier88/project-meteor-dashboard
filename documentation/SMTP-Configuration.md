# Configuration SMTP - Meteor

Ce document décrit les différents modes de configuration SMTP pour l'envoi d'emails depuis l'application Meteor.

## Variables d'environnement

| Variable | Obligatoire | Description | Valeur par défaut |
|----------|-------------|-------------|-------------------|
| `EDGE_SMTP_HOST` | ✅ Oui | Hostname du serveur SMTP | - |
| `EDGE_SMTP_PORT` | Non | Port du serveur SMTP | `25` |
| `EDGE_SMTP_FROM` | ✅ Oui | Adresse email expéditeur | - |
| `EDGE_SMTP_USER` | Non* | Nom d'utilisateur SMTP | - |
| `EDGE_SMTP_PASS` | Non* | Mot de passe SMTP | - |
| `EDGE_SMTP_TLS` | Non | Forcer TLS (`true`/`false`) | Auto-détection |
| `EDGE_APP_URL` | Non | URL de l'application | `https://meteor.app` |

> *Les variables `EDGE_SMTP_USER` et `EDGE_SMTP_PASS` sont requises uniquement en mode authentifié.

## Modes de configuration

### Mode 1 : Cloud / Authentifié (Deno Deploy)

Ce mode est utilisé pour les déploiements sur Supabase Cloud / Deno Deploy, où une authentification SMTP est requise.

**⚠️ Important** : Deno Deploy bloque les ports SMTP standards (25, 465, 587). Vous devez utiliser un service d'envoi d'emails compatible HTTP (comme Resend) ou un port non standard (ex: 2525).

```bash
EDGE_SMTP_HOST=smtp.provider.com
EDGE_SMTP_PORT=587
EDGE_SMTP_USER=user@domain.com
EDGE_SMTP_PASS=votre_mot_de_passe
EDGE_SMTP_FROM=noreply@domain.com
EDGE_SMTP_TLS=true
```

### Mode 2 : Self-hosted / Sans authentification

Ce mode est conçu pour les déploiements on-premise où un relais SMTP interne est disponible, sécurisé par IP whitelist plutôt que par authentification.

```bash
EDGE_SMTP_HOST=relay.internal.local
EDGE_SMTP_PORT=25
EDGE_SMTP_FROM=meteor@domain.com
# Pas de EDGE_SMTP_USER / EDGE_SMTP_PASS = connexion sans authentification
```

## Détection automatique du mode

Le système détecte automatiquement le mode en fonction des variables configurées :

- **Si `EDGE_SMTP_USER` ET `EDGE_SMTP_PASS` sont définis** → Mode authentifié
- **Si `EDGE_SMTP_USER` OU `EDGE_SMTP_PASS` est absent** → Mode sans authentification

## Configuration TLS

Le TLS est géré automatiquement selon les règles suivantes :

1. Si `EDGE_SMTP_TLS=true` → TLS activé
2. Si `EDGE_SMTP_TLS=false` → TLS désactivé
3. Si `EDGE_SMTP_TLS` non défini et port = 465 → TLS activé (SMTPS implicite)
4. Sinon → TLS désactivé

## Exemples de configuration

### Relais interne sur port 25 (self-hosted)

```bash
EDGE_SMTP_HOST=smtp-relay.internal.company.local
EDGE_SMTP_PORT=25
EDGE_SMTP_FROM=meteor@company.com
EDGE_APP_URL=https://meteor.company.local
```

### Office 365 / Microsoft 365

```bash
EDGE_SMTP_HOST=smtp.office365.com
EDGE_SMTP_PORT=587
EDGE_SMTP_USER=meteor@company.com
EDGE_SMTP_PASS=votre_mot_de_passe_app
EDGE_SMTP_FROM=meteor@company.com
EDGE_SMTP_TLS=true
```

### Gmail (avec mot de passe d'application)

```bash
EDGE_SMTP_HOST=smtp.gmail.com
EDGE_SMTP_PORT=587
EDGE_SMTP_USER=votre.email@gmail.com
EDGE_SMTP_PASS=mot_de_passe_application
EDGE_SMTP_FROM=votre.email@gmail.com
EDGE_SMTP_TLS=true
```

### Mailhog (développement local)

```bash
EDGE_SMTP_HOST=localhost
EDGE_SMTP_PORT=1025
EDGE_SMTP_FROM=dev@localhost
```

## Logs de diagnostic

Les Edge Functions affichent des logs détaillés lors de l'envoi d'emails :

```
[send-email-digest] Configuration SMTP: {
  host: "relay.internal.local",
  port: 25,
  tls: false,
  auth: "sans authentification",
  from: "meteor@domain.com"
}
```

Ces logs permettent de vérifier que la configuration est correctement appliquée.

## Dépannage

### Erreur "Configuration SMTP manquante"

Vérifiez que les variables obligatoires sont définies :
- `EDGE_SMTP_HOST`
- `EDGE_SMTP_FROM`

### Erreur de connexion SMTP

1. Vérifiez que le serveur SMTP est accessible depuis l'environnement d'exécution
2. Pour Deno Deploy, les ports 25, 465, 587 sont bloqués
3. Vérifiez les règles de firewall si en self-hosted

### Emails non reçus

1. Vérifiez les logs de la fonction Edge dans Supabase
2. Vérifiez les logs du serveur SMTP
3. Vérifiez que l'adresse `EDGE_SMTP_FROM` est autorisée à envoyer
