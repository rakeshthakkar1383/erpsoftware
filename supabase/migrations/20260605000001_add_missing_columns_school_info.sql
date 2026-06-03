-- Add missing columns to school_info (safe to re-run)
ALTER TABLE school_info ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE school_info ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE school_info ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
