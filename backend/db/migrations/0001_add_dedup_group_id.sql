-- Migration: Add dedup_group_id to alerts table
-- This supports semantic deduplication grouping (title similarity + geo + time window)

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS dedup_group_id UUID REFERENCES alerts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS alerts_dedup_group_idx ON alerts(dedup_group_id);

COMMENT ON COLUMN alerts.dedup_group_id IS
  'Points to the primary alert in a dedup group. NULL means this IS the primary (or ungrouped).';
