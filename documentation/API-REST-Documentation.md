# API REST Meteor - Documentation

## 📋 Vue d'ensemble

L'API REST Meteor permet d'interroger les données de projets, équipes, tâches et risques de manière programmatique. Cette API est conçue pour faciliter les intégrations avec des systèmes externes (ERP, outils de reporting, dashboards personnalisés, etc.).

**URL de base de l'API :**
```
https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway
```

---

## 🔐 Authentification

Toutes les requêtes à l'API nécessitent un token d'authentification. Deux méthodes sont supportées :

### Méthode 1 : Header X-API-Key (recommandée)
```bash
X-API-Key: votre_token_api
```

### Méthode 2 : Authorization Bearer
```bash
Authorization: Bearer votre_token_api
```

### Obtenir un token API

1. Connectez-vous à l'application Meteor
2. Accédez à **Administration** > **Tokens API**
3. Cliquez sur **Nouveau Token**
4. Configurez le nom, la date d'expiration et les périmètres d'accès
5. **Copiez le token immédiatement** (il ne sera plus affiché)

⚠️ **Important** : Conservez vos tokens en lieu sûr. Ils donnent accès à vos données.

---

## 📍 Endpoints disponibles

### 1. Liste des projets

Récupère la liste des projets accessibles selon les périmètres du token.

**Endpoint :**
```
GET /api/projects
```

**Paramètres de requête (tous optionnels) :**

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `status` | string | Filtrer par statut météo | `green`, `orange`, `red` |
| `lifecycle_status` | string | Filtrer par statut du cycle de vie | `idea`, `planning`, `in_progress`, `on_hold`, `completed`, `cancelled` |
| `pole_id` | uuid | Filtrer par pôle | `a1b2c3d4-...` |
| `direction_id` | uuid | Filtrer par direction | `e5f6g7h8-...` |
| `service_id` | uuid | Filtrer par service | `i9j0k1l2-...` |
| `search` | string | Recherche textuelle sur le titre | `transformation` |
| `suivi_dgs` | boolean | Filtrer les projets DGS | `true`, `false` |
| `limit` | integer | Nombre de résultats (max: 100) | `50` |
| `offset` | integer | Décalage pour pagination | `0` |

**Exemple de requête :**

```bash
curl -X GET "https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway/api/projects?status=green&limit=10" \
  -H "X-API-Key: votre_token"
```

**Exemple de réponse (200 OK) :**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
      "title": "Transformation digitale des services",
      "description": "Modernisation des outils numériques",
      "status": "green",
      "lifecycle_status": "in_progress",
      "project_manager": "chef.projet@example.com",
      "project_manager_id": "uuid-du-manager",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "pole_id": "pole-uuid",
      "direction_id": "direction-uuid",
      "service_id": "service-uuid",
      "suivi_dgs": true,
      "priority": "high",
      "poles": {
        "name": "Pôle Innovation"
      },
      "directions": {
        "name": "Direction des Systèmes d'Information"
      },
      "services": {
        "name": "Service Numérique"
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 42
  }
}
```

---

### 2. Détails d'un projet

Récupère les informations détaillées d'un projet spécifique, incluant sa dernière revue et des statistiques.

**Endpoint :**
```
GET /api/projects/{project_id}
```

**Paramètres :**
- `project_id` (path, requis) : UUID du projet

**Exemple de requête :**

```bash
curl -X GET "https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway/api/projects/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6" \
  -H "X-API-Key: votre_token"
```

**Exemple de réponse (200 OK) :**

```json
{
  "project": {
    "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "title": "Transformation digitale des services",
    "description": "Modernisation des outils numériques",
    "status": "green",
    "lifecycle_status": "in_progress",
    "project_manager": "chef.projet@example.com",
    "project_manager_id": "uuid-du-manager",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "pole_id": "pole-uuid",
    "direction_id": "direction-uuid",
    "service_id": "service-uuid",
    "suivi_dgs": true,
    "priority": "high",
    "progress": "on_track",
    "last_review_date": "2025-10-20T10:30:00Z",
    "created_at": "2024-12-01T08:00:00Z",
    "updated_at": "2025-10-20T10:30:00Z",
    "poles": {
      "name": "Pôle Innovation"
    },
    "directions": {
      "name": "Direction des Systèmes d'Information"
    },
    "services": {
      "name": "Service Numérique"
    }
  },
  "last_review": {
    "weather": "green",
    "progress": "on_track",
    "completion": 65,
    "created_at": "2025-10-20T10:30:00Z",
    "comment": "Le projet avance bien, respect du planning"
  },
  "statistics": {
    "team_members": 8,
    "tasks": 24,
    "risks": 3
  }
}
```

---

### 3. Équipe d'un projet

Récupère la liste des membres de l'équipe d'un projet.

**Endpoint :**
```
GET /api/projects/{project_id}/team
```

**Paramètres :**
- `project_id` (path, requis) : UUID du projet

**Exemple de requête :**

```bash
curl -X GET "https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway/api/projects/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6/team" \
  -H "X-API-Key: votre_token"
```

**Exemple de réponse (200 OK) :**

```json
{
  "data": [
    {
      "user_id": "user-uuid-1",
      "email": "alice.dupont@example.com",
      "first_name": "Alice",
      "last_name": "Dupont",
      "role": "secondary_manager",
      "joined_at": "2025-01-15T09:00:00Z"
    },
    {
      "user_id": "user-uuid-2",
      "email": "bob.martin@example.com",
      "first_name": "Bob",
      "last_name": "Martin",
      "role": "member",
      "joined_at": "2025-02-01T14:30:00Z"
    }
  ]
}
```

---

### 4. Tâches d'un projet

Récupère la liste des tâches d'un projet avec des filtres optionnels.

**Endpoint :**
```
GET /api/projects/{project_id}/tasks
```

**Paramètres :**
- `project_id` (path, requis) : UUID du projet

**Paramètres de requête (optionnels) :**

| Paramètre | Type | Description | Valeurs possibles |
|-----------|------|-------------|-------------------|
| `status` | string | Filtrer par statut | `todo`, `in_progress`, `done`, `blocked` |
| `assignee` | string | Filtrer par assigné | Email de l'utilisateur |

**Exemple de requête :**

```bash
curl -X GET "https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway/api/projects/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6/tasks?status=in_progress" \
  -H "X-API-Key: votre_token"
```

**Exemple de réponse (200 OK) :**

```json
{
  "data": [
    {
      "id": "task-uuid-1",
      "title": "Développement de l'interface utilisateur",
      "description": "Créer les maquettes et implémenter les composants React",
      "status": "in_progress",
      "start_date": "2025-10-01",
      "due_date": "2025-10-31",
      "assignee": "dev@example.com",
      "parent_task_id": null,
      "created_at": "2025-09-15T10:00:00Z",
      "updated_at": "2025-10-20T15:30:00Z"
    },
    {
      "id": "task-uuid-2",
      "title": "Tests unitaires des composants",
      "description": "Écrire les tests Jest pour les nouveaux composants",
      "status": "in_progress",
      "start_date": "2025-10-15",
      "due_date": "2025-10-25",
      "assignee": "qa@example.com",
      "parent_task_id": "task-uuid-1",
      "created_at": "2025-10-10T11:00:00Z",
      "updated_at": "2025-10-21T09:15:00Z"
    }
  ]
}
```

---

### 5. Risques d'un projet

Récupère la liste des risques identifiés pour un projet.

**Endpoint :**
```
GET /api/projects/{project_id}/risks
```

**Paramètres :**
- `project_id` (path, requis) : UUID du projet

**Paramètres de requête (optionnels) :**

| Paramètre | Type | Description | Valeurs possibles |
|-----------|------|-------------|-------------------|
| `status` | string | Filtrer par statut | `open`, `in_mitigation`, `closed` |
| `severity` | string | Filtrer par sévérité | `low`, `medium`, `high`, `critical` |
| `probability` | string | Filtrer par probabilité | `low`, `medium`, `high` |

**Exemple de requête :**

```bash
curl -X GET "https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway/api/projects/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6/risks?status=open&severity=high" \
  -H "X-API-Key: votre_token"
```

**Exemple de réponse (200 OK) :**

```json
{
  "data": [
    {
      "id": "risk-uuid-1",
      "description": "Retard potentiel dû à la disponibilité des ressources",
      "probability": "medium",
      "severity": "high",
      "status": "open",
      "mitigation_plan": "Planifier une ressource de backup et anticiper les besoins",
      "created_at": "2025-09-01T10:00:00Z",
      "updated_at": "2025-10-15T14:30:00Z"
    },
    {
      "id": "risk-uuid-2",
      "description": "Dépendance technologique critique sur un service externe",
      "probability": "low",
      "severity": "high",
      "status": "open",
      "mitigation_plan": "Prévoir une solution de secours et un plan de continuité",
      "created_at": "2025-09-10T09:00:00Z",
      "updated_at": "2025-10-01T11:20:00Z"
    }
  ]
}
```

---

## 📊 Codes de réponse HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| `200` | OK | Requête réussie |
| `400` | Bad Request | Paramètres invalides ou manquants |
| `401` | Unauthorized | Token manquant, invalide, expiré ou inactif |
| `403` | Forbidden | Accès refusé (le token n'a pas accès à cette ressource) |
| `404` | Not Found | Ressource introuvable |
| `500` | Internal Server Error | Erreur serveur |

---

## ❌ Gestion des erreurs

Toutes les erreurs renvoient un objet JSON avec un champ `error` :

**Exemple d'erreur 401 (token invalide) :**
```json
{
  "error": "Invalid, expired or inactive API key"
}
```

**Exemple d'erreur 403 (accès refusé) :**
```json
{
  "error": "Access denied to this project"
}
```

**Exemple d'erreur 404 (projet introuvable) :**
```json
{
  "error": "Project not found or error fetching details"
}
```

**Exemple d'erreur 500 (erreur serveur) :**
```json
{
  "error": "Internal server error",
  "message": "Description détaillée de l'erreur"
}
```

---

## 🔍 Périmètres d'accès (Scopes)

Les tokens API peuvent être restreints à des périmètres spécifiques :

### Types de données accessibles
- `projects` : Données des projets
- `team` : Membres des équipes
- `tasks` : Tâches des projets
- `risks` : Risques identifiés

### Restrictions organisationnelles
Un token peut être restreint à :
- Des **pôles** spécifiques
- Des **directions** spécifiques
- Des **services** spécifiques
- Des **projets** spécifiques

Si aucune restriction n'est configurée, le token a accès à toutes les données du type autorisé.

---

## 🚀 Exemples d'utilisation

### Exemple en cURL

```bash
# Récupérer tous les projets en cours avec statut vert
curl -X GET "https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway/api/projects?lifecycle_status=in_progress&status=green" \
  -H "X-API-Key: votre_token_api"
```

### Exemple en Python

```python
import requests

API_BASE_URL = "https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway"
API_TOKEN = "votre_token_api"

headers = {
    "X-API-Key": API_TOKEN
}

# Récupérer la liste des projets
response = requests.get(
    f"{API_BASE_URL}/api/projects",
    headers=headers,
    params={
        "lifecycle_status": "in_progress",
        "limit": 20
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"Nombre de projets: {data['pagination']['total']}")
    for project in data['data']:
        print(f"- {project['title']} ({project['status']})")
else:
    print(f"Erreur: {response.json()['error']}")
```

### Exemple en JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_BASE_URL = 'https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway';
const API_TOKEN = 'votre_token_api';

const headers = {
  'X-API-Key': API_TOKEN
};

async function getProjects() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/projects`, {
      headers,
      params: {
        lifecycle_status: 'in_progress',
        limit: 20
      }
    });
    
    console.log(`Nombre de projets: ${response.data.pagination.total}`);
    response.data.data.forEach(project => {
      console.log(`- ${project.title} (${project.status})`);
    });
  } catch (error) {
    console.error('Erreur:', error.response?.data?.error || error.message);
  }
}

getProjects();
```

### Exemple en PHP

```php
<?php

$apiBaseUrl = 'https://rgfabywkwllxoqsahrpt.supabase.co/functions/v1/api-gateway';
$apiToken = 'votre_token_api';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiBaseUrl . '/api/projects?lifecycle_status=in_progress&limit=20');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $apiToken
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    echo "Nombre de projets: " . $data['pagination']['total'] . "\n";
    foreach ($data['data'] as $project) {
        echo "- " . $project['title'] . " (" . $project['status'] . ")\n";
    }
} else {
    $error = json_decode($response, true);
    echo "Erreur: " . $error['error'] . "\n";
}
?>
```

---

## 📈 Bonnes pratiques

### 1. Sécurité
- ✅ **Ne jamais exposer** vos tokens dans le code source (utilisez des variables d'environnement)
- ✅ **Révoquer immédiatement** un token si vous suspectez une compromission
- ✅ **Définir une date d'expiration** pour les tokens temporaires
- ✅ **Utiliser le principe du moindre privilège** : restreindre les périmètres au minimum nécessaire

### 2. Performance
- ✅ **Utiliser la pagination** pour les grandes listes de projets
- ✅ **Filtrer côté serveur** plutôt que de récupérer toutes les données
- ✅ **Mettre en cache** les réponses API quand c'est pertinent

### 3. Gestion des erreurs
- ✅ **Toujours vérifier** les codes de réponse HTTP
- ✅ **Implémenter des retry** avec backoff exponentiel en cas d'erreur 500
- ✅ **Logger les erreurs** pour faciliter le débogage

### 4. Monitoring
- ✅ **Surveiller l'utilisation** de vos tokens depuis l'interface d'administration
- ✅ **Vérifier les logs d'API** pour détecter les utilisations anormales
- ✅ **Définir des alertes** en cas de taux d'erreur élevé

---

## 🔄 Limites et quotas

| Limite | Valeur |
|--------|--------|
| Requêtes par token | Illimité (pour le moment) |
| Taille max de réponse | 100 projets par requête |
| Timeout de requête | 30 secondes |
| Formats de réponse | JSON uniquement |

> **Note** : Des limites de taux (rate limiting) pourront être ajoutées dans les versions futures.

---

## 📞 Support

Pour toute question ou problème concernant l'API :

1. Consultez d'abord cette documentation
2. Vérifiez les logs d'API dans l'interface d'administration
3. Contactez l'équipe technique Meteor

---

## 🆕 Changelog

### Version 1.0.0 (Octobre 2025)
- ✨ Lancement initial de l'API REST
- 📍 5 endpoints disponibles
- 🔐 Authentification par token API
- 🎯 Support des périmètres d'accès configurables
- 📊 Pagination et filtres avancés

---

**Date de dernière mise à jour** : 28 octobre 2025  
**Version de l'API** : 1.0.0
