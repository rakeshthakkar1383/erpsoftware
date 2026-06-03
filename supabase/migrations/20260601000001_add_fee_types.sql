-- Add fee type support for dynamic fee categories

-- 1. Create fee_types table
CREATE TABLE IF NOT EXISTS fee_types (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  description text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;

-- 2. Add fee_type_id to fees
ALTER TABLE fees
  ADD COLUMN IF NOT EXISTS fee_type_id bigint REFERENCES fee_types(id) ON DELETE SET NULL;

-- 3. Add fee_type_id to fee_particulars
ALTER TABLE fee_particulars
  ADD COLUMN IF NOT EXISTS fee_type_id bigint REFERENCES fee_types(id) ON DELETE CASCADE;
