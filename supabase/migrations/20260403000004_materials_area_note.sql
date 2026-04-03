-- Migration 4: materials table + material_note on areas

-- Add material_note column to areas
ALTER TABLE areas ADD COLUMN IF NOT EXISTS material_note TEXT;

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL,
  name          TEXT        NOT NULL,
  category      TEXT        NOT NULL CHECK (category IN ('floor', 'walls', 'ceiling')),
  is_common     BOOLEAN     NOT NULL DEFAULT TRUE,
  display_order INTEGER     NOT NULL DEFAULT 0,
  active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name, category)
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_read_own_tenant"
  ON materials FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "materials_insert_owner"
  ON materials FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
  );

CREATE POLICY "materials_update_owner"
  ON materials FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
  );

CREATE POLICY "materials_delete_owner"
  ON materials FOR DELETE
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
  );
