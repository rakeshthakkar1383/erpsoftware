-- Backfill missing receipt numbers for all Paid fee records
-- Logic: School-wise, Year-wise, and Category-wise starting from 1
WITH year_mapped_fees AS (
  SELECT 
    f.id,
    f.school_id,
    f.fee_category,
    f.created_at,
    COALESCE(f.receipt_year, ay.year_name, to_char(f.created_at, 'YYYY')) as ay_name
  FROM fees f
  LEFT JOIN students s ON f.student_id = s.id
  LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
  WHERE f.status = 'Paid' AND (f.receipt_no IS NULL OR f.receipt_year IS NULL)
),
numbered_fees AS (
  SELECT 
    id,
    ay_name,
    ROW_NUMBER() OVER(
      PARTITION BY school_id, ay_name, fee_category 
      ORDER BY created_at ASC
    ) as new_receipt_no
  FROM year_mapped_fees
)
UPDATE fees f
SET receipt_no = n.new_receipt_no,
    receipt_year = n.ay_name
FROM numbered_fees n
WHERE f.id = n.id;
