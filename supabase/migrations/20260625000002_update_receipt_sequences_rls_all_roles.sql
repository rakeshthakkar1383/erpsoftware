-- Update receipt_sequences RLS to allow clerk, principal, and supervision roles
-- consistent with other tables

DROP POLICY IF EXISTS receipt_sequences_select ON receipt_sequences;
DROP POLICY IF EXISTS receipt_sequences_insert ON receipt_sequences;
DROP POLICY IF EXISTS receipt_sequences_update ON receipt_sequences;

CREATE POLICY receipt_sequences_select ON receipt_sequences FOR SELECT USING (
  can_see_all() OR school_id = get_school_id()
);

CREATE POLICY receipt_sequences_insert ON receipt_sequences FOR INSERT WITH CHECK (
  can_see_all() 
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
);

CREATE POLICY receipt_sequences_update ON receipt_sequences FOR UPDATE USING (
  can_see_all() 
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
);
