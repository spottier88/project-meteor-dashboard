-- Table des revues de portefeuille organisées
CREATE TABLE public.portfolio_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.project_portfolios(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  review_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_portfolio_reviews_portfolio ON portfolio_reviews(portfolio_id);
CREATE INDEX idx_portfolio_reviews_date ON portfolio_reviews(review_date);
CREATE INDEX idx_portfolio_reviews_status ON portfolio_reviews(status);

-- RLS
ALTER TABLE portfolio_reviews ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : peut voir les revues si accès au portefeuille
CREATE POLICY "Users can view portfolio reviews if they can access the portfolio"
  ON portfolio_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_portfolios pp
      WHERE pp.id = portfolio_reviews.portfolio_id
      AND (
        pp.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
        OR EXISTS (SELECT 1 FROM portfolio_managers pm WHERE pm.portfolio_id = pp.id AND pm.user_id = auth.uid())
      )
    )
  );

-- Politique INSERT : peut créer si peut gérer le portefeuille
CREATE POLICY "Users can create portfolio reviews if they can manage the portfolio"
  ON portfolio_reviews FOR INSERT
  WITH CHECK (can_manage_portfolio_simple(auth.uid(), portfolio_id));

-- Politique UPDATE : peut modifier si peut gérer le portefeuille
CREATE POLICY "Users can update portfolio reviews if they can manage the portfolio"
  ON portfolio_reviews FOR UPDATE
  USING (can_manage_portfolio_simple(auth.uid(), portfolio_id));

-- Politique DELETE : peut supprimer si peut gérer le portefeuille
CREATE POLICY "Users can delete portfolio reviews if they can manage the portfolio"
  ON portfolio_reviews FOR DELETE
  USING (can_manage_portfolio_simple(auth.uid(), portfolio_id));

-- Table des notifications de revue de portefeuille (historique des envois)
CREATE TABLE public.portfolio_review_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_review_id UUID NOT NULL REFERENCES public.portfolio_reviews(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

-- Index
CREATE INDEX idx_portfolio_review_notifications_review ON portfolio_review_notifications(portfolio_review_id);

-- RLS
ALTER TABLE portfolio_review_notifications ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : peut voir si accès à la revue
CREATE POLICY "Users can view notification history if they can access the review"
  ON portfolio_review_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_reviews pr
      JOIN project_portfolios pp ON pp.id = pr.portfolio_id
      WHERE pr.id = portfolio_review_notifications.portfolio_review_id
      AND (
        pp.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
        OR EXISTS (SELECT 1 FROM portfolio_managers pm WHERE pm.portfolio_id = pp.id AND pm.user_id = auth.uid())
      )
    )
  );

-- Politique INSERT : peut ajouter si peut gérer le portefeuille
CREATE POLICY "Users can log notifications if they can manage the portfolio"
  ON portfolio_review_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_reviews pr
      WHERE pr.id = portfolio_review_notifications.portfolio_review_id
      AND can_manage_portfolio_simple(auth.uid(), pr.portfolio_id)
    )
  );

-- Trigger pour updated_at
CREATE TRIGGER update_portfolio_reviews_updated_at
  BEFORE UPDATE ON portfolio_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();