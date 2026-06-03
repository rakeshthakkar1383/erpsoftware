-- Add receipt_file_url column to fees if not already present
ALTER TABLE fees ADD COLUMN IF NOT EXISTS receipt_file_url text;
