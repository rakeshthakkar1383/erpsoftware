-- Backfill missing school_id for students, fees, fee_types, and fee_particulars
-- This ensures records created by admins (without a school context) are visible to clerks.

-- 1. Update fees from students
UPDATE fees f
SET school_id = s.school_id
FROM students s
WHERE f.student_id = s.id
AND f.school_id IS NULL
AND s.school_id IS NOT NULL;

-- 2. Update students from fees
UPDATE students s
SET school_id = f.school_id
FROM fees f
WHERE s.id = f.student_id
AND s.school_id IS NULL
AND f.school_id IS NOT NULL;

-- 3. Update fee_types from trust_info
UPDATE fee_types ft
SET school_id = ti.school_id
FROM trust_info ti
WHERE ft.trust_id = ti.id
AND ft.school_id IS NULL
AND ti.school_id IS NOT NULL;

-- 4. Update fee_particulars from fee_types
UPDATE fee_particulars fp
SET school_id = ft.school_id
FROM fee_types ft
WHERE fp.fee_type_id = ft.id
AND fp.school_id IS NULL
AND ft.school_id IS NOT NULL;
