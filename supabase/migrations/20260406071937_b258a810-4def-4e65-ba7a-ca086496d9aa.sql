CREATE OR REPLACE FUNCTION public.sync_portfolio_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.portfolio_id IS NOT NULL THEN
        PERFORM update_portfolio_stats(NEW.portfolio_id);
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.portfolio_id IS NOT NULL
       AND OLD.portfolio_id != COALESCE(NEW.portfolio_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        PERFORM update_portfolio_stats(OLD.portfolio_id);
    END IF;

    IF TG_OP = 'DELETE' AND OLD.portfolio_id IS NOT NULL THEN
        PERFORM update_portfolio_stats(OLD.portfolio_id);
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;