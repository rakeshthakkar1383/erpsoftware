-- Ensure 'clerk' role has explicit access to fee_types
-- Mirroring 'principal' and 'supervision' roles

DROP POLICY IF EXISTS fee_types_select ON fee_types;
CREATE POLICY fee_types_select ON fee_types FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
);
