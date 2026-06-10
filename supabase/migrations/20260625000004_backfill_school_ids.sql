-- Backfill missing school_id for students and fees
-- For students: if school_id is null, try to inherit it from another student in the same class (as a best guess)
-- OR just leave it null if ambiguous. 
-- For fees: if school_id is null, inherit it from the student record.

-- 1. Update fees from students
UPDATE fees f
SET school_id = s.school_id
FROM students s
WHERE f.student_id = s.id
AND f.school_id IS NULL
AND s.school_id IS NOT NULL;

-- 2. Update students from fees (if a fee exists with a school_id for that student)
UPDATE students s
SET school_id = f.school_id
FROM fees f
WHERE s.id = f.student_id
AND s.school_id IS NULL
AND f.school_id IS NOT NULL;
