-- 2026-10-27: which price comparison the buyer saw at checkout.
-- Additive only: existing rows keep NULL. Apply after 20261020-blog-trials.sql.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_variant text;

-- Report: paid orders per comparison (ids from data/course.config.json → payments.comparisons).
-- SELECT coalesce(price_variant, '(none)') AS variant, count(*) AS paid_orders
-- FROM orders WHERE status = 'paid' GROUP BY 1 ORDER BY 2 DESC;
