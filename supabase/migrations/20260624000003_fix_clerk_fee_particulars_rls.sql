-- Ensure 'clerk' and 'teacher' roles have explicit access to fee_particulars
-- Mirroring 'principal' and 'supervision' roles

DROP POLICY IF EXISTS fee_particulars_select ON fee_particulars;
CREATE POLICY fee_particulars_select ON fee_particulars FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk', 'teacher') AND school_id = get_school_id())
);
