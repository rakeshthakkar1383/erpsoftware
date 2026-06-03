-- Add trust_name column to school_info if missing
ALTER TABLE school_info ADD COLUMN IF NOT EXISTS trust_name text;
