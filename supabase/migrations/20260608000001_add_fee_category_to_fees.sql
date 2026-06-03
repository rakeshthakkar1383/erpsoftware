ALTER TABLE fees ADD COLUMN IF NOT EXISTS fee_category text DEFAULT 'School' CHECK (fee_category IN ('School', 'Trust'));
