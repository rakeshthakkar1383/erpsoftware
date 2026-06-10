-- 1. Create atomic function to increment receipt number
CREATE OR REPLACE FUNCTION increment_receipt_no(
  p_school_id bigint,
  p_year text,
  p_category text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_no integer;
BEGIN
  INSERT INTO receipt_sequences (school_id, receipt_year, fee_category, last_receipt_no)
  VALUES (p_school_id, p_year, p_category, 1)
  ON CONFLICT (school_id, receipt_year, p_category) 
  DO UPDATE SET last_receipt_no = receipt_sequences.last_receipt_no + 1
  RETURNING last_receipt_no INTO v_next_no;
  
  RETURN v_next_no;
END;
$$;
