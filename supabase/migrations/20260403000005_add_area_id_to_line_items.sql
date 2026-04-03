-- Add area_id to line_items (nullable = project-level, e.g. General)
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE CASCADE;

-- Index for per-area queries
CREATE INDEX IF NOT EXISTS line_items_area_id_idx ON line_items(area_id);
CREATE INDEX IF NOT EXISTS line_items_estimate_area_module_idx ON line_items(estimate_id, area_id, module);
