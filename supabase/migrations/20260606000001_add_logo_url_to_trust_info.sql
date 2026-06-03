-- Add logo_url column to trust_info if missing
ALTER TABLE trust_info ADD COLUMN IF NOT EXISTS logo_url text;
