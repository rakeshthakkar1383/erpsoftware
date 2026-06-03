-- Add trust support to fee_types and fee_particulars tables
-- Allows fee types and fee particulars to be associated with either a School or a Trust

-- fee_types: add fee_category and trust_id
ALTER TABLE fee_types ADD COLUMN IF NOT EXISTS fee_category text DEFAULT 'School' CHECK (fee_category IN ('School', 'Trust'));
ALTER TABLE fee_types ADD COLUMN IF NOT EXISTS trust_id bigint REFERENCES trust_info(id) ON DELETE SET NULL;

-- fee_particulars: add fee_category and trust_id
ALTER TABLE fee_particulars ADD COLUMN IF NOT EXISTS fee_category text DEFAULT 'School' CHECK (fee_category IN ('School', 'Trust'));
ALTER TABLE fee_particulars ADD COLUMN IF NOT EXISTS trust_id bigint REFERENCES trust_info(id) ON DELETE SET NULL;
