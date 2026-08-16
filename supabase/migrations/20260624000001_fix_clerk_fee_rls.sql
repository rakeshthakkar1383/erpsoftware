-- Ensure 'clerk' role has explicit access to school data
-- Mirroring 'principal' and 'supervision' roles

DROP POLICY IF EXISTS fees_select ON fees;
CREATE POLICY fees_select ON fees FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
  OR (get_user_role() = 'teacher' AND school_id = get_school_id())
  OR (get_user_role() = 'student' AND student_id = get_linked_student_id())
);

DROP POLICY IF EXISTS students_select ON students;
CREATE POLICY students_select ON students FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
  OR (
    get_user_role() = 'teacher'
    AND school_id = get_school_id()
    AND (get_user_classes() = '' OR class_name = ANY(string_to_array(get_user_classes(), ',')))
  )
  OR (get_user_role() = 'student' AND id = get_linked_student_id())
);

DROP POLICY IF EXISTS attendance_select ON attendance;
CREATE POLICY attendance_select ON attendance FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'clerk') AND school_id = get_school_id())
  OR (
    get_user_role() = 'teacher'
    AND school_id = get_school_id()
    AND student_id IN (
      SELECT id
      FROM students
      WHERE school_id = get_school_id()
        AND (get_user_classes() = '' OR class_name = ANY(string_to_array(get_user_classes(), ',')))
    )
  )
  OR (get_user_role() = 'student' AND student_id = get_linked_student_id())
);
