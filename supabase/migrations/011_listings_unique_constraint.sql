-- Add unique constraint on listings for upsert support.
-- The deals cron uses onConflict: "product_id,source,source_url" which
-- requires this constraint to exist.

ALTER TABLE listings
ADD CONSTRAINT listings_product_source_url_unique
UNIQUE (product_id, source, source_url);
