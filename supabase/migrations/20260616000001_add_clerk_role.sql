-- 1. Add 'clerk' to users role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'teacher', 'authority', 'principal', 'supervision', 'clerk', 'student'));

-- 2. Update Students Select Policy to include clerk
DROP POLICY IF EXISTS students_select ON students;
CREATE POLICY students_select ON students FOR SELECT USING (
  can_see_all() 
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
  OR (get_user_role() = 'teacher' AND school_id = get_school_id() AND (get_user_classes() = '' OR class_name = ANY(string_to_array(get_user_classes(), ','))))
  OR (get_user_role() = 'student' AND id = get_linked_student_id())
);

-- 3. Update Fees Select Policy to include clerk
DROP POLICY IF EXISTS fees_select ON fees;
CREATE POLICY fees_select ON fees FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
  OR (get_user_role() = 'teacher' AND school_id = get_school_id())
  OR (get_user_role() = 'student' AND student_id = get_linked_student_id())
);

-- 4. Update Fees Insert/Update/Delete to include clerk
DROP POLICY IF EXISTS fees_insert ON fees;
DROP POLICY IF EXISTS fees_update ON fees;
DROP POLICY IF EXISTS fees_delete ON fees;
CREATE POLICY fees_insert ON fees FOR INSERT WITH CHECK (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
);
CREATE POLICY fees_update ON fees FOR UPDATE USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
);
CREATE POLICY fees_delete ON fees FOR DELETE USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
);

-- 5. Update Teachers Select Policy to include clerk
DROP POLICY IF EXISTS teachers_select ON teachers;
CREATE POLICY teachers_select ON teachers FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk', 'teacher') AND school_id = get_school_id())
);
