-- Mise à jour des politiques RLS pour autoriser l'accès via portefeuille

-- Tasks : autoriser la lecture via portefeuille
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
CREATE POLICY "Users can view tasks"
ON public.tasks
FOR SELECT
USING (
  can_access_project(auth.uid(), project_id)
  OR can_access_project_via_portfolio(auth.uid(), project_id)
);

-- Risks : autoriser la lecture via portefeuille
DROP POLICY IF EXISTS "Users can view risks" ON risks;
CREATE POLICY "Users can view risks"
ON public.risks
FOR SELECT
USING (
  can_access_project(auth.uid(), project_id)
  OR can_access_project_via_portfolio(auth.uid(), project_id)
);

-- Reviews : autoriser la lecture via portefeuille
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
CREATE POLICY "Users can view reviews"
ON public.reviews
FOR SELECT
USING (
  can_access_project(auth.uid(), project_id)
  OR can_access_project_via_portfolio(auth.uid(), project_id)
);

-- Projects : autoriser la lecture via portefeuille (mise à jour de la politique existante)
DROP POLICY IF EXISTS "Users can view projects" ON projects;
CREATE POLICY "Users can view projects"
ON public.projects
FOR SELECT
USING (
  can_access_project(auth.uid(), id)
  OR can_access_project_via_portfolio(auth.uid(), id)
);