-- Re-sequence all Paid fee records to start from Receipt No 1
-- Partitioned by school_id, receipt_year (Academic Year), and fee_category
-- This will eliminate gaps and ensure a clean 1, 2, 3... sequence

WITH numbered_fees AS (
  SELECT 
    id,
    ROW_NUMBER() OVER(
      PARTITION BY school_id, receipt_year, fee_category 
      ORDER BY payment_date ASC, created_at ASC
    ) as new_receipt_no
  FROM fees
  WHERE status = 'Paid' AND receipt_year IS NOT NULL
)
UPDATE fees f
SET receipt_no = n.new_receipt_no
FROM numbered_fees n
WHERE f.id = n.id;
