-- Drop the global GR number uniqueness so GR numbers can repeat across schools.
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_gr_no_unique;

-- Clear duplicates within the same school, keeping the earliest record.
WITH ranked AS (
  SELECT id, school_id, gr_no,
         ROW_NUMBER() OVER (PARTITION BY school_id, gr_no ORDER BY id) AS rn
  FROM students
  WHERE school_id IS NOT NULL
    AND gr_no IS NOT NULL
    AND btrim(gr_no) <> ''
)
UPDATE students s
SET gr_no = NULL
FROM ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- Enforce GR number uniqueness per school instead of globally.
CREATE UNIQUE INDEX IF NOT EXISTS students_school_gr_no_unique
ON students (school_id, gr_no)
WHERE gr_no IS NOT NULL
  AND btrim(gr_no) <> ''
  AND school_id IS NOT NULL;
