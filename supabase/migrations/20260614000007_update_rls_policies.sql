-- 1. Helper to check if user has global visibility
CREATE OR REPLACE FUNCTION can_see_all()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'can_see_all_data')::boolean,
    get_user_role() = 'admin' OR get_user_role() = 'authority'
  )
$$;

-- 2. Helper to get assigned classes (comma separated)
CREATE OR REPLACE FUNCTION get_user_classes()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'class_name',
    ''
  )
$$;

-- 3. Helper to get linked student ID
CREATE OR REPLACE FUNCTION get_linked_student_id()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'student_id')::bigint,
    0
  )
$$;

-- 4. Update Students Select Policy
DROP POLICY IF EXISTS students_select ON students;
CREATE POLICY students_select ON students FOR SELECT USING (
  can_see_all() 
  OR (get_user_role() IN ('principal', 'supervision') AND school_id = get_school_id())
  OR (get_user_role() = 'teacher' AND school_id = get_school_id() AND (get_user_classes() = '' OR class_name = ANY(string_to_array(get_user_classes(), ','))))
  OR (get_user_role() = 'student' AND id = get_linked_student_id())
);

-- 5. Update Fees Select Policy
DROP POLICY IF EXISTS fees_select ON fees;
CREATE POLICY fees_select ON fees FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision') AND school_id = get_school_id())
  OR (get_user_role() = 'teacher' AND school_id = get_school_id()) -- Teachers can usually see fee status
  OR (get_user_role() = 'student' AND student_id = get_linked_student_id())
);

-- 6. Update Teachers Select Policy
DROP POLICY IF EXISTS teachers_select ON teachers;
CREATE POLICY teachers_select ON teachers FOR SELECT USING (
  can_see_all()
  OR (get_user_role() IN ('principal', 'supervision', 'teacher') AND school_id = get_school_id())
);
