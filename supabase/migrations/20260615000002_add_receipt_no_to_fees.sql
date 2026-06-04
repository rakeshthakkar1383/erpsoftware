-- Add receipt_no and receipt_year to fees table for sequential receipt numbering
ALTER TABLE fees
ADD COLUMN IF NOT EXISTS receipt_no integer,
ADD COLUMN IF NOT EXISTS receipt_year text;
