-- Comprehensive RLS Update: Allow Authority, Principal, and Clerk roles 
-- to perform CRUD (Insert, Update, Delete) operations on their school's data.

-- Tables to update: students, fees, fee_types, fee_particulars, teachers, 
-- attendance, exams, marks, subjects, divisions, streams, teacher_subjects, 
-- academic_years, trust_info, school_info, receipt_sequences

-- Define a helper for change access
CREATE OR REPLACE FUNCTION can_manage_all()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'can_manage_all_data')::boolean,
    get_user_role() IN ('admin', 'authority')
  )
$$;

-- Define a helper for school-specific management
CREATE OR REPLACE FUNCTION is_school_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT get_user_role() IN ('principal', 'supervision', 'clerk')
$$;

-- 1. students
DROP POLICY IF EXISTS students_insert ON students;
DROP POLICY IF EXISTS students_update ON students;
DROP POLICY IF EXISTS students_delete ON students;
CREATE POLICY students_insert ON students FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY students_update ON students FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY students_delete ON students FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 2. fees
DROP POLICY IF EXISTS fees_insert ON fees;
DROP POLICY IF EXISTS fees_update ON fees;
DROP POLICY IF EXISTS fees_delete ON fees;
CREATE POLICY fees_insert ON fees FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY fees_update ON fees FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY fees_delete ON fees FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 3. fee_types
DROP POLICY IF EXISTS fee_types_insert ON fee_types;
DROP POLICY IF EXISTS fee_types_update ON fee_types;
DROP POLICY IF EXISTS fee_types_delete ON fee_types;
CREATE POLICY fee_types_insert ON fee_types FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY fee_types_update ON fee_types FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY fee_types_delete ON fee_types FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 4. fee_particulars
DROP POLICY IF EXISTS fee_particulars_insert ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_update ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_delete ON fee_particulars;
CREATE POLICY fee_particulars_insert ON fee_particulars FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY fee_particulars_update ON fee_particulars FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY fee_particulars_delete ON fee_particulars FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 5. teachers
DROP POLICY IF EXISTS teachers_insert ON teachers;
DROP POLICY IF EXISTS teachers_update ON teachers;
DROP POLICY IF EXISTS teachers_delete ON teachers;
CREATE POLICY teachers_insert ON teachers FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY teachers_update ON teachers FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY teachers_delete ON teachers FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 6. attendance
DROP POLICY IF EXISTS attendance_insert ON attendance;
DROP POLICY IF EXISTS attendance_update ON attendance;
DROP POLICY IF EXISTS attendance_delete ON attendance;
CREATE POLICY attendance_insert ON attendance FOR INSERT WITH CHECK (can_manage_all() OR school_id = get_school_id());
CREATE POLICY attendance_update ON attendance FOR UPDATE USING (can_manage_all() OR school_id = get_school_id());
CREATE POLICY attendance_delete ON attendance FOR DELETE USING (can_manage_all() OR school_id = get_school_id());

-- 7. exams
DROP POLICY IF EXISTS exams_insert ON exams;
DROP POLICY IF EXISTS exams_update ON exams;
DROP POLICY IF EXISTS exams_delete ON exams;
CREATE POLICY exams_insert ON exams FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY exams_update ON exams FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY exams_delete ON exams FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 8. marks
DROP POLICY IF EXISTS marks_insert ON marks;
DROP POLICY IF EXISTS marks_update ON marks;
DROP POLICY IF EXISTS marks_delete ON marks;
CREATE POLICY marks_insert ON marks FOR INSERT WITH CHECK (can_manage_all() OR school_id = get_school_id());
CREATE POLICY marks_update ON marks FOR UPDATE USING (can_manage_all() OR school_id = get_school_id());
CREATE POLICY marks_delete ON marks FOR DELETE USING (can_manage_all() OR school_id = get_school_id());

-- 9. subjects
DROP POLICY IF EXISTS subjects_insert ON subjects;
DROP POLICY IF EXISTS subjects_update ON subjects;
DROP POLICY IF EXISTS subjects_delete ON subjects;
CREATE POLICY subjects_insert ON subjects FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY subjects_update ON subjects FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY subjects_delete ON subjects FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 10. divisions
DROP POLICY IF EXISTS divisions_insert ON divisions;
DROP POLICY IF EXISTS divisions_update ON divisions;
DROP POLICY IF EXISTS divisions_delete ON divisions;
CREATE POLICY divisions_insert ON divisions FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY divisions_update ON divisions FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY divisions_delete ON divisions FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 11. streams
DROP POLICY IF EXISTS streams_insert ON streams;
DROP POLICY IF EXISTS streams_update ON streams;
DROP POLICY IF EXISTS streams_delete ON streams;
CREATE POLICY streams_insert ON streams FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY streams_update ON streams FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY streams_delete ON streams FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 12. teacher_subjects
DROP POLICY IF EXISTS teacher_subjects_insert ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_update ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_delete ON teacher_subjects;
CREATE POLICY teacher_subjects_insert ON teacher_subjects FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY teacher_subjects_update ON teacher_subjects FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY teacher_subjects_delete ON teacher_subjects FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 13. academic_years
DROP POLICY IF EXISTS academic_years_insert ON academic_years;
DROP POLICY IF EXISTS academic_years_update ON academic_years;
DROP POLICY IF EXISTS academic_years_delete ON academic_years;
CREATE POLICY academic_years_insert ON academic_years FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY academic_years_update ON academic_years FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY academic_years_delete ON academic_years FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 14. trust_info
DROP POLICY IF EXISTS trust_info_insert ON trust_info;
DROP POLICY IF EXISTS trust_info_update ON trust_info;
DROP POLICY IF EXISTS trust_info_delete ON trust_info;
CREATE POLICY trust_info_insert ON trust_info FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY trust_info_update ON trust_info FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));
CREATE POLICY trust_info_delete ON trust_info FOR DELETE USING (can_manage_all() OR (is_school_staff() AND school_id = get_school_id()));

-- 15. school_info
DROP POLICY IF EXISTS school_info_insert ON school_info;
DROP POLICY IF EXISTS school_info_update ON school_info;
DROP POLICY IF EXISTS school_info_delete ON school_info;
CREATE POLICY school_info_insert ON school_info FOR INSERT WITH CHECK (can_manage_all() OR (is_school_staff() AND id = get_school_id()));
CREATE POLICY school_info_update ON school_info FOR UPDATE USING (can_manage_all() OR (is_school_staff() AND id = get_school_id()));
CREATE POLICY school_info_delete ON school_info FOR DELETE USING (can_manage_all() OR (is_school_staff() AND id = get_school_id()));
