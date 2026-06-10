-- 1. Create dedicated table for receipt sequences
CREATE TABLE IF NOT EXISTS receipt_sequences (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  receipt_year text NOT NULL,
  fee_category text NOT NULL,
  last_receipt_no integer DEFAULT 0,
  UNIQUE(school_id, receipt_year, fee_category)
);

-- Enable RLS
ALTER TABLE receipt_sequences ENABLE ROW LEVEL SECURITY;

-- 2. Grant necessary access
CREATE POLICY receipt_sequences_select ON receipt_sequences FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY receipt_sequences_insert ON receipt_sequences FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY receipt_sequences_update ON receipt_sequences FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- 3. Migration to populate existing sequences from fees table
INSERT INTO receipt_sequences (school_id, receipt_year, fee_category, last_receipt_no)
SELECT school_id, receipt_year, fee_category, MAX(receipt_no)
FROM fees
WHERE receipt_no IS NOT NULL AND receipt_year IS NOT NULL
GROUP BY school_id, receipt_year, fee_category
ON CONFLICT (school_id, receipt_year, fee_category) DO UPDATE SET last_receipt_no = EXCLUDED.last_receipt_no;
