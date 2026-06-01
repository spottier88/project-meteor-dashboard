# Statistiques administrateur

Deux nouvelles pages réservées au rôle `admin`, accessibles depuis le tableau de bord d'administration, dans une nouvelle catégorie "Statistiques".

## Pages & routes

- `/admin/stats-content` — **Statistiques de contenu** (état du patrimoine de données)
- `/admin/stats-usage` — **Statistiques d'usage** (activité des utilisateurs dans le temps)

Ajout dans `AdminDashboard.tsx` d'une nouvelle catégorie "Statistiques" (icône `BarChart3`) avec ces 2 entrées. Protection par `ProtectedRoute` + check `isAdmin`.

## Filtres communs (barre supérieure)

- Sélecteur de période : `7j / 30j / 90j / Année / Personnalisé` (Popover + Calendar shadcn, `pointer-events-auto`)
- Filtre cascade Pôle → Direction → Service (réutilise `OrganizationFieldsSelects`)
- Bouton **Exporter** : XLSX (via `exceljs`) + PDF (via `html-to-image` + impression) du tableau de bord courant
- Filtres persistés en `localStorage` (clés `admin-stats-content-filters`, `admin-stats-usage-filters`)

## Page 1 — Statistiques de contenu

KPI cards en haut + sections détaillées dessous.

**Bloc Projets**
- KPI : total projets, % en cours, % terminés, % innovants, avancement moyen
- Donut : répartition par statut (lifecycle_status)
- Donut : répartition par météo (sunny/cloudy/stormy)
- Barres horizontales : projets par pôle / direction (selon filtre actif)
- Indicateur : projets sans revue depuis 30j

**Bloc Tâches / Risques / Revues**
- KPI tâches : total, % terminées, % en retard
- KPI risques : ouverts, critiques (probabilité × sévérité élevée)
- KPI revues : total sur période, fréquence moyenne par projet, projets sans revue

**Bloc Organisation & utilisateurs**
- KPI : nb pôles/directions/services, nb utilisateurs actifs/inactifs
- Barres : utilisateurs par rôle (depuis `user_roles`)
- Table : top 10 chefs de projet par nombre de projets gérés

## Page 2 — Statistiques d'usage

**Bloc Connexions & utilisateurs actifs**
- KPI : DAU / WAU / MAU (utilisateurs distincts ayant agi sur la période)
- Courbe : utilisateurs actifs par jour
- Table : top 20 utilisateurs (dernière connexion, nb actions)
- Indicateur : comptes jamais connectés / inactifs >30j

**Bloc Activité fonctionnelle**
- KPI sur la période : projets créés, revues saisies, tâches créées/terminées, notes ajoutées, risques déclarés
- Courbe d'évolution multi-séries (1 série par type d'événement, agrégation jour/semaine selon période)
- Barres : activité par pôle/direction
- Top 10 projets les plus actifs (somme événements)

## Détails techniques

**Hooks data (nouveaux dans `src/hooks/admin-stats/`)**
- `useContentStats(filters)` — agrège `projects`, `tasks`, `risks`, `reviews`, `profiles`, `user_roles`, `poles/directions/services`
- `useUsageStats(filters)` — agrège DAU/WAU/MAU + séries temporelles d'événements

**Source des données d'usage**
- Connexions : on **n'utilise pas** `auth_logs` (non requêtable côté client). À la place, on s'appuie sur les `created_at`/`updated_at` des tables métier comme proxy d'activité, **et** on ajoute une fonction RPC `get_user_activity_stats(start, end)` côté Postgres qui agrège depuis `projects.created_at`, `reviews.created_at`, `tasks.created_at/updated_at`, `project_notes.created_at`, `risks.created_at`, `activities.created_at`.
- Création d'une **vue matérialisée** `admin_daily_activity` (jour, user_id, event_type, count) rafraîchie par cron quotidien — évite des agrégations lourdes côté client.

**Composants**
- `src/pages/admin/StatsContent.tsx`, `src/pages/admin/StatsUsage.tsx`
- `src/components/admin/stats/StatsFiltersBar.tsx` (période + org + export)
- `src/components/admin/stats/KpiCard.tsx`, `StatsBarChart.tsx`, `StatsLineChart.tsx`, `StatsDonutChart.tsx` (Recharts)
- `src/utils/adminStatsExport.ts` — export XLSX (exceljs) et PDF (html-to-image + window.print fallback)

**Migrations Supabase**
1. Vue matérialisée `admin_daily_activity` + index sur `(day, user_id, event_type)`
2. Fonction RPC `get_admin_content_stats(p_pole, p_direction, p_service)` `SECURITY DEFINER` réservée admin (check `has_role(auth.uid(),'admin')`)
3. Fonction RPC `get_admin_usage_stats(p_start, p_end, p_pole, p_direction, p_service)` même restriction
4. GRANT EXECUTE aux `authenticated` (le filtre admin est dans la fonction)
5. Cron `pg_cron` (si dispo) ou refresh à la demande au chargement de la page si dernière maj > 1h

**Routing**
- Ajout dans `src/routes.tsx` des 2 routes sous garde admin

## Hors périmètre (volontairement)
- Stats sur exports/IA/portefeuilles/cadrages (non sélectionnés)
- Suivi d'activités hebdo (non sélectionné)
- Drill-down vers fiche projet (peut être ajouté en V2)
