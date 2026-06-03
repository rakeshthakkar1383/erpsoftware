-- Fix RLS policies for all tables to allow admin users (superadmins) to bypass school_id checks
-- Admin users have role 'admin' in user_metadata but may not have a school_id

-- fee_types
DROP POLICY IF EXISTS fee_types_select ON fee_types;
DROP POLICY IF EXISTS fee_types_insert ON fee_types;
DROP POLICY IF EXISTS fee_types_update ON fee_types;
DROP POLICY IF EXISTS fee_types_delete ON fee_types;
CREATE POLICY fee_types_select ON fee_types FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_types_insert ON fee_types FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_types_update ON fee_types FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_types_delete ON fee_types FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- students
DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS students_insert ON students;
DROP POLICY IF EXISTS students_update ON students;
DROP POLICY IF EXISTS students_delete ON students;
CREATE POLICY students_select ON students FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY students_insert ON students FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY students_update ON students FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY students_delete ON students FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- teachers
DROP POLICY IF EXISTS teachers_select ON teachers;
DROP POLICY IF EXISTS teachers_insert ON teachers;
DROP POLICY IF EXISTS teachers_update ON teachers;
DROP POLICY IF EXISTS teachers_delete ON teachers;
CREATE POLICY teachers_select ON teachers FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teachers_insert ON teachers FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teachers_update ON teachers FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teachers_delete ON teachers FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- fees
DROP POLICY IF EXISTS fees_select ON fees;
DROP POLICY IF EXISTS fees_insert ON fees;
DROP POLICY IF EXISTS fees_update ON fees;
DROP POLICY IF EXISTS fees_delete ON fees;
CREATE POLICY fees_select ON fees FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fees_insert ON fees FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fees_update ON fees FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fees_delete ON fees FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- fee_particulars
DROP POLICY IF EXISTS fee_particulars_select ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_insert ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_update ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_delete ON fee_particulars;
CREATE POLICY fee_particulars_select ON fee_particulars FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_particulars_insert ON fee_particulars FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_particulars_update ON fee_particulars FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_particulars_delete ON fee_particulars FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- attendance
DROP POLICY IF EXISTS attendance_select ON attendance;
DROP POLICY IF EXISTS attendance_insert ON attendance;
DROP POLICY IF EXISTS attendance_update ON attendance;
DROP POLICY IF EXISTS attendance_delete ON attendance;
CREATE POLICY attendance_select ON attendance FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY attendance_insert ON attendance FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY attendance_update ON attendance FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY attendance_delete ON attendance FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- exams
DROP POLICY IF EXISTS exams_select ON exams;
DROP POLICY IF EXISTS exams_insert ON exams;
DROP POLICY IF EXISTS exams_update ON exams;
DROP POLICY IF EXISTS exams_delete ON exams;
CREATE POLICY exams_select ON exams FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY exams_insert ON exams FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY exams_update ON exams FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY exams_delete ON exams FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- marks
DROP POLICY IF EXISTS marks_select ON marks;
DROP POLICY IF EXISTS marks_insert ON marks;
DROP POLICY IF EXISTS marks_update ON marks;
DROP POLICY IF EXISTS marks_delete ON marks;
CREATE POLICY marks_select ON marks FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY marks_insert ON marks FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY marks_update ON marks FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY marks_delete ON marks FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- subjects
DROP POLICY IF EXISTS subjects_select ON subjects;
DROP POLICY IF EXISTS subjects_insert ON subjects;
DROP POLICY IF EXISTS subjects_update ON subjects;
DROP POLICY IF EXISTS subjects_delete ON subjects;
CREATE POLICY subjects_select ON subjects FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY subjects_insert ON subjects FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY subjects_update ON subjects FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY subjects_delete ON subjects FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- divisions
DROP POLICY IF EXISTS divisions_select ON divisions;
DROP POLICY IF EXISTS divisions_insert ON divisions;
DROP POLICY IF EXISTS divisions_update ON divisions;
DROP POLICY IF EXISTS divisions_delete ON divisions;
CREATE POLICY divisions_select ON divisions FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY divisions_insert ON divisions FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY divisions_update ON divisions FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY divisions_delete ON divisions FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- streams
DROP POLICY IF EXISTS streams_select ON streams;
DROP POLICY IF EXISTS streams_insert ON streams;
DROP POLICY IF EXISTS streams_update ON streams;
DROP POLICY IF EXISTS streams_delete ON streams;
CREATE POLICY streams_select ON streams FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY streams_insert ON streams FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY streams_update ON streams FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY streams_delete ON streams FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- teacher_subjects
DROP POLICY IF EXISTS teacher_subjects_select ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_insert ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_update ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_delete ON teacher_subjects;
CREATE POLICY teacher_subjects_select ON teacher_subjects FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teacher_subjects_insert ON teacher_subjects FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teacher_subjects_update ON teacher_subjects FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teacher_subjects_delete ON teacher_subjects FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');
