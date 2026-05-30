-- School ERP Database Schema for Supabase
-- Run this in Supabase SQL Editor to create all tables and RLS policies.

-- 1. school_info
CREATE TABLE IF NOT EXISTS school_info (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  school_name text,
  address text,
  phone text,
  email text,
  website text,
  principal_name text,
  affiliation text,
  logo_url text,
  updated_at timestamp DEFAULT now()
);

-- 2. users
CREATE TABLE IF NOT EXISTS users (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text,
  role text CHECK (role IN ('admin', 'teacher')),
  teacher_id bigint REFERENCES teachers(id) ON DELETE SET NULL,
  class_name text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 3. students
CREATE TABLE IF NOT EXISTS students (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admission_no text,
  full_name text,
  gender text,
  father_name text,
  mother_name text,
  dob text,
  birthplace text,
  mobile text,
  address text,
  village text,
  district text,
  city text,
  last_school text,
  division text,
  class_name text,
  stream text,
  roll_no bigint,
  academic_year_id bigint REFERENCES academic_years(id) ON DELETE SET NULL,
  photo_url text,
  birth_cert_url text,
  aadhar_url text,
  father_aadhar_url text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 4. teachers
CREATE TABLE IF NOT EXISTS teachers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name text,
  subject text,
  mobile text,
  salary numeric(10,2),
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 5. fees
CREATE TABLE IF NOT EXISTS fees (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id bigint REFERENCES students(id) ON DELETE CASCADE,
  amount numeric(10,2),
  status text DEFAULT 'Paid',
  payment_date text,
  payment_mode text,
  transaction_id text,
  cheque_number text,
  cheque_date text,
  bank_name text,
  particulars jsonb DEFAULT '[]'::jsonb,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 6. fee_particulars
CREATE TABLE IF NOT EXISTS fee_particulars (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name text,
  particular_name text,
  amount numeric(10,2),
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 7. attendance
CREATE TABLE IF NOT EXISTS attendance (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id bigint REFERENCES students(id) ON DELETE CASCADE,
  attendance_date text,
  status text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 8. exams
CREATE TABLE IF NOT EXISTS exams (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  exam_name text,
  class_name text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 9. marks
CREATE TABLE IF NOT EXISTS marks (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id bigint REFERENCES students(id) ON DELETE CASCADE,
  exam_id bigint REFERENCES exams(id) ON DELETE CASCADE,
  subject text,
  marks numeric(10,2),
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 10. subjects
CREATE TABLE IF NOT EXISTS subjects (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name text,
  subject_name text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 11. academic_years
CREATE TABLE IF NOT EXISTS academic_years (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  year_name text,
  start_date text,
  end_date text,
  is_active boolean DEFAULT false,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 12. divisions
CREATE TABLE IF NOT EXISTS divisions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name text,
  division_name text,
  class_teacher_id bigint REFERENCES teachers(id) ON DELETE SET NULL,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 13. streams
CREATE TABLE IF NOT EXISTS streams (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name text,
  stream_name text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 14. teacher_subjects
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  teacher_id bigint REFERENCES teachers(id) ON DELETE CASCADE,
  class_name text,
  subject text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 15. auth_sessions (used by Supabase Auth — handled automatically)
-- No custom table needed; Supabase manages auth internally.

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all tables
ALTER TABLE school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_particulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's school_id from auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION get_school_id()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT (raw_user_meta_data->>'school_id')::bigint FROM auth.users WHERE id = auth.uid()),
    0
  )
$$;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    ''
  )
$$;

-- Generic RLS policies for multi-tenant data isolation
-- For all school-scoped tables: users can only see rows matching their school_id

-- school_info: admins can see all, teachers see their own school
CREATE POLICY school_info_select ON school_info FOR SELECT USING (
  id = get_school_id() OR get_user_role() = 'admin'
);
CREATE POLICY school_info_insert ON school_info FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY school_info_update ON school_info FOR UPDATE USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY school_info_delete ON school_info FOR DELETE USING (get_user_role() = 'admin');

-- users: only see users in same school
CREATE POLICY users_select ON users FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY users_update ON users FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY users_delete ON users FOR DELETE USING (get_user_role() = 'admin');

-- students
CREATE POLICY students_select ON students FOR SELECT USING (school_id = get_school_id());
CREATE POLICY students_insert ON students FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY students_update ON students FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY students_delete ON students FOR DELETE USING (school_id = get_school_id());

-- teachers
CREATE POLICY teachers_select ON teachers FOR SELECT USING (school_id = get_school_id());
CREATE POLICY teachers_insert ON teachers FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY teachers_update ON teachers FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY teachers_delete ON teachers FOR DELETE USING (school_id = get_school_id());

-- fees
CREATE POLICY fees_select ON fees FOR SELECT USING (school_id = get_school_id());
CREATE POLICY fees_insert ON fees FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY fees_update ON fees FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY fees_delete ON fees FOR DELETE USING (school_id = get_school_id());

-- fee_particulars
CREATE POLICY fee_particulars_select ON fee_particulars FOR SELECT USING (school_id = get_school_id());
CREATE POLICY fee_particulars_insert ON fee_particulars FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY fee_particulars_update ON fee_particulars FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY fee_particulars_delete ON fee_particulars FOR DELETE USING (school_id = get_school_id());

-- attendance
CREATE POLICY attendance_select ON attendance FOR SELECT USING (school_id = get_school_id());
CREATE POLICY attendance_insert ON attendance FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY attendance_update ON attendance FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY attendance_delete ON attendance FOR DELETE USING (school_id = get_school_id());

-- exams
CREATE POLICY exams_select ON exams FOR SELECT USING (school_id = get_school_id());
CREATE POLICY exams_insert ON exams FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY exams_update ON exams FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY exams_delete ON exams FOR DELETE USING (school_id = get_school_id());

-- marks
CREATE POLICY marks_select ON marks FOR SELECT USING (school_id = get_school_id());
CREATE POLICY marks_insert ON marks FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY marks_update ON marks FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY marks_delete ON marks FOR DELETE USING (school_id = get_school_id());

-- subjects
CREATE POLICY subjects_select ON subjects FOR SELECT USING (school_id = get_school_id());
CREATE POLICY subjects_insert ON subjects FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY subjects_update ON subjects FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY subjects_delete ON subjects FOR DELETE USING (school_id = get_school_id());

-- academic_years
CREATE POLICY academic_years_select ON academic_years FOR SELECT USING (school_id = get_school_id());
CREATE POLICY academic_years_insert ON academic_years FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY academic_years_update ON academic_years FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY academic_years_delete ON academic_years FOR DELETE USING (school_id = get_school_id());

-- divisions
CREATE POLICY divisions_select ON divisions FOR SELECT USING (school_id = get_school_id());
CREATE POLICY divisions_insert ON divisions FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY divisions_update ON divisions FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY divisions_delete ON divisions FOR DELETE USING (school_id = get_school_id());

-- streams
CREATE POLICY streams_select ON streams FOR SELECT USING (school_id = get_school_id());
CREATE POLICY streams_insert ON streams FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY streams_update ON streams FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY streams_delete ON streams FOR DELETE USING (school_id = get_school_id());

-- teacher_subjects
CREATE POLICY teacher_subjects_select ON teacher_subjects FOR SELECT USING (school_id = get_school_id());
CREATE POLICY teacher_subjects_insert ON teacher_subjects FOR INSERT WITH CHECK (school_id = get_school_id());
CREATE POLICY teacher_subjects_update ON teacher_subjects FOR UPDATE USING (school_id = get_school_id());
CREATE POLICY teacher_subjects_delete ON teacher_subjects FOR DELETE USING (school_id = get_school_id());
