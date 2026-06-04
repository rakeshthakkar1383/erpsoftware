-- Add permissions column to users table for role-based tab access
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;