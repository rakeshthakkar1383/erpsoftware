-- Add transfer_date column to students for next-class promotion / transfer
ALTER TABLE students ADD COLUMN IF NOT EXISTS transfer_date text;

COMMENT ON COLUMN students.transfer_date IS 'Date of last class transfer / promotion to next class';
