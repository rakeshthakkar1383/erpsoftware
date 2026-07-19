-- Add UNIQUE constraint on gr_no to prevent duplicate entries
-- First clean up any existing duplicates by keeping the first occurrence
WITH duplicates AS (
  SELECT id, gr_no,
    ROW_NUMBER() OVER (PARTITION BY gr_no ORDER BY id) as rn
  FROM students
  WHERE gr_no IS NOT NULL AND gr_no != ''
)
UPDATE students SET gr_no = NULL
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Now add the unique constraint
ALTER TABLE students ADD CONSTRAINT students_gr_no_unique UNIQUE (gr_no);
