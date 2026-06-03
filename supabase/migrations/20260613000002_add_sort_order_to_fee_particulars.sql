-- Add sort_order column to fee_particulars for manual reordering
ALTER TABLE fee_particulars
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Backfill unique sort_order for existing rows (ensures reordering works)
UPDATE fee_particulars fp
SET sort_order = fp2.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, class_name, particular_name, id) AS new_order
  FROM fee_particulars
) fp2
WHERE fp.id = fp2.id AND fp.sort_order IS DISTINCT FROM fp2.new_order;
