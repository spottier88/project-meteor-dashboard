

# Ajout de l'envoi d'email via smtp-api dans `invite-user`

## Constat

- **`send-email-digest`** : utilise déjà le microservice smtp-api via `EDGE_SMTP_API_URL` / `EDGE_SMTP_API_KEY` / `EDGE_SMTP_FROM`. Aucune modification nécessaire puisque la configuration SMTP (user, pass, host, port, secure) est côté serveur.
- **`send-test-email`** et **`send-portfolio-review-email`** : idem, utilisent déjà smtp-api.
- **`invite-user`** : utilise `supabase.auth.admin.generateLink({ type: "magiclink" })` — ne passe **pas** par le microservice smtp-api. C'est la seule fonction à modifier.

## Modification prévue

### Fichier : `supabase/functions/invite-user/index.ts`

1. **Ajouter la configuration smtp-api** (mêmes variables que les autres edge functions) :
   - `EDGE_SMTP_API_URL`, `EDGE_SMTP_API_KEY`, `EDGE_SMTP_FROM`, `EDGE_APP_URL`

2. **Ajouter la fonction `sendEmailViaApi`** (même pattern que `send-email-digest`) pour appeler le microservice HTTP.

3. **Remplacer l'appel `generateLink`** par :
   - Génération du magic link via `supabase.auth.admin.generateLink({ type: "magiclink", email })` (on conserve la génération du lien)
   - Extraction de l'URL du lien depuis la réponse
   - Construction d'un email HTML d'invitation contenant le lien
   - Envoi via `sendEmailViaApi` au lieu de laisser Supabase envoyer l'email

4. **Vérification de la configuration** : ajouter un contrôle que `EDGE_SMTP_API_URL`, `EDGE_SMTP_API_KEY` et `EDGE_SMTP_FROM` sont définis avant l'envoi.

## Ce qui ne change pas

- La création de l'utilisateur (`createUser`)
- L'attribution du rôle
- L'ajout au projet si `projectId` fourni
- La logique d'utilisateur existant
- Les autres edge functions (`send-email-digest`, `send-test-email`, `send-portfolio-review-email`)

