-- Ensure 'clerk' role has explicit access to fees
-- Mirroring 'principal' and 'supervision' roles

DROP POLICY IF EXISTS fees_select ON fees;
CREATE POLICY fees_select ON fees FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
  OR (get_user_role() = 'teacher' AND school_id = get_school_id())
  OR (get_user_role() = 'student' AND student_id = get_linked_student_id())
);
