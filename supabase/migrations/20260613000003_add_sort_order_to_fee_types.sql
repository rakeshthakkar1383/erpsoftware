-- Add sort_order column to fee_types for manual reordering
ALTER TABLE fee_types
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Backfill unique sort_order for existing rows
UPDATE fee_types ft
SET sort_order = ft2.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, name, id) AS new_order
  FROM fee_types
) ft2
WHERE ft.id = ft2.id AND ft.sort_order IS DISTINCT FROM ft2.new_order;
