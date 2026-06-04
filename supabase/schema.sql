-- School ERP Database Schema for Supabase
-- Run this in Supabase SQL Editor to create all tables and RLS policies.

-- 1. school_info
CREATE TABLE IF NOT EXISTS school_info (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  school_name text,
  trust_name text,
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
  trust_id bigint REFERENCES trust_info(id) ON DELETE SET NULL,
  fee_type_id bigint REFERENCES fee_types(id) ON DELETE SET NULL,
  fee_category text DEFAULT 'School' CHECK (fee_category IN ('School', 'Trust')),
  amount numeric(10,2),
  status text DEFAULT 'Paid',
  payment_date text,
  payment_mode text,
  transaction_id text,
  cheque_number text,
  cheque_date text,
  bank_name text,
  particulars jsonb DEFAULT '[]'::jsonb,
  receipt_no integer,
  receipt_year text,
  receipt_file_url text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 6. fee_installments
CREATE TABLE IF NOT EXISTS fee_installments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fee_id bigint REFERENCES fees(id) ON DELETE CASCADE,
  month_number integer NOT NULL,
  due_date text,
  amount numeric(10,2),
  status text DEFAULT 'Pending',
  paid_date text,
  payment_mode text,
  transaction_id text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 6. fee_types
CREATE TABLE IF NOT EXISTS fee_types (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  description text,
  fee_category text DEFAULT 'School' CHECK (fee_category IN ('School', 'Trust')),
  sort_order integer DEFAULT 0,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  trust_id bigint REFERENCES trust_info(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- 7. fee_particulars
CREATE TABLE IF NOT EXISTS fee_particulars (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name text NOT NULL,
  particular_name text,
  amount numeric(10,2),
  duration_months integer DEFAULT 12 CHECK (duration_months IN (6, 12)),
  term text DEFAULT 'Yearly' CHECK (term IN ('First Term', 'Second Term', 'Yearly')),
  sort_order integer DEFAULT 0,
  fee_type_id bigint REFERENCES fee_types(id) ON DELETE CASCADE,
  fee_category text DEFAULT 'School' CHECK (fee_category IN ('School', 'Trust')),
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  trust_id bigint REFERENCES trust_info(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now()
);

-- 8. attendance
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
  class_name text NOT NULL,
  subject_name text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 11. divisions
CREATE TABLE IF NOT EXISTS divisions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name text NOT NULL,
  division_name text,
  class_teacher_id bigint REFERENCES teachers(id) ON DELETE SET NULL,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 13. streams
CREATE TABLE IF NOT EXISTS streams (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  class_name text NOT NULL,
  stream_name text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- 14. teacher_subjects
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  teacher_id bigint REFERENCES teachers(id) ON DELETE CASCADE,
  class_name text,
  subject text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE
);

-- 15. trust_info
CREATE TABLE IF NOT EXISTS trust_info (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  trust_name text NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  registration_no text,
  logo_url text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- auth_sessions (used by Supabase Auth — handled automatically)
-- No custom table needed; Supabase manages auth internally.

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all tables
ALTER TABLE school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_particulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_info ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow idempotent re-runs
DROP POLICY IF EXISTS school_info_select ON school_info;
DROP POLICY IF EXISTS school_info_insert ON school_info;
DROP POLICY IF EXISTS school_info_update ON school_info;
DROP POLICY IF EXISTS school_info_delete ON school_info;
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_update ON users;
DROP POLICY IF EXISTS users_delete ON users;
DROP POLICY IF EXISTS students_select ON students;
DROP POLICY IF EXISTS students_insert ON students;
DROP POLICY IF EXISTS students_update ON students;
DROP POLICY IF EXISTS students_delete ON students;
DROP POLICY IF EXISTS teachers_select ON teachers;
DROP POLICY IF EXISTS teachers_insert ON teachers;
DROP POLICY IF EXISTS teachers_update ON teachers;
DROP POLICY IF EXISTS teachers_delete ON teachers;
DROP POLICY IF EXISTS fees_select ON fees;
DROP POLICY IF EXISTS fees_insert ON fees;
DROP POLICY IF EXISTS fees_update ON fees;
DROP POLICY IF EXISTS fees_delete ON fees;
DROP POLICY IF EXISTS fee_particulars_select ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_insert ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_update ON fee_particulars;
DROP POLICY IF EXISTS fee_particulars_delete ON fee_particulars;
DROP POLICY IF EXISTS fee_installments_select ON fee_installments;
DROP POLICY IF EXISTS fee_installments_insert ON fee_installments;
DROP POLICY IF EXISTS fee_installments_update ON fee_installments;
DROP POLICY IF EXISTS fee_installments_delete ON fee_installments;
DROP POLICY IF EXISTS fee_types_select ON fee_types;
DROP POLICY IF EXISTS fee_types_insert ON fee_types;
DROP POLICY IF EXISTS fee_types_update ON fee_types;
DROP POLICY IF EXISTS fee_types_delete ON fee_types;
DROP POLICY IF EXISTS attendance_select ON attendance;
DROP POLICY IF EXISTS attendance_insert ON attendance;
DROP POLICY IF EXISTS attendance_update ON attendance;
DROP POLICY IF EXISTS attendance_delete ON attendance;
DROP POLICY IF EXISTS exams_select ON exams;
DROP POLICY IF EXISTS exams_insert ON exams;
DROP POLICY IF EXISTS exams_update ON exams;
DROP POLICY IF EXISTS exams_delete ON exams;
DROP POLICY IF EXISTS marks_select ON marks;
DROP POLICY IF EXISTS marks_insert ON marks;
DROP POLICY IF EXISTS marks_update ON marks;
DROP POLICY IF EXISTS marks_delete ON marks;
DROP POLICY IF EXISTS subjects_select ON subjects;
DROP POLICY IF EXISTS subjects_insert ON subjects;
DROP POLICY IF EXISTS subjects_update ON subjects;
DROP POLICY IF EXISTS subjects_delete ON subjects;
DROP POLICY IF EXISTS divisions_select ON divisions;
DROP POLICY IF EXISTS divisions_insert ON divisions;
DROP POLICY IF EXISTS divisions_update ON divisions;
DROP POLICY IF EXISTS divisions_delete ON divisions;
DROP POLICY IF EXISTS streams_select ON streams;
DROP POLICY IF EXISTS streams_insert ON streams;
DROP POLICY IF EXISTS streams_update ON streams;
DROP POLICY IF EXISTS streams_delete ON streams;
DROP POLICY IF EXISTS teacher_subjects_select ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_insert ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_update ON teacher_subjects;
DROP POLICY IF EXISTS teacher_subjects_delete ON teacher_subjects;
DROP POLICY IF EXISTS trust_info_select ON trust_info;
DROP POLICY IF EXISTS trust_info_insert ON trust_info;
DROP POLICY IF EXISTS trust_info_update ON trust_info;
DROP POLICY IF EXISTS trust_info_delete ON trust_info;
DROP POLICY IF EXISTS "authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated users can view" ON storage.objects;
DROP POLICY IF EXISTS "authenticated users can delete" ON storage.objects;

-- Helper function to get current user's school_id from JWT user_metadata
CREATE OR REPLACE FUNCTION get_school_id()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF((auth.jwt() -> 'user_metadata' ->> 'school_id'), '')::bigint,
    0
  )
$$;

-- Helper function to get current user's role from JWT user_metadata
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
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
CREATE POLICY students_select ON students FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY students_insert ON students FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY students_update ON students FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY students_delete ON students FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- teachers
CREATE POLICY teachers_select ON teachers FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teachers_insert ON teachers FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teachers_update ON teachers FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teachers_delete ON teachers FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- fees
CREATE POLICY fees_select ON fees FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fees_insert ON fees FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fees_update ON fees FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fees_delete ON fees FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- fee_particulars
CREATE POLICY fee_particulars_select ON fee_particulars FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_particulars_insert ON fee_particulars FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_particulars_update ON fee_particulars FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_particulars_delete ON fee_particulars FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- fee_installments
CREATE POLICY fee_installments_select ON fee_installments FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_installments_insert ON fee_installments FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_installments_update ON fee_installments FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_installments_delete ON fee_installments FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- fee_types
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_types_select ON fee_types FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_types_insert ON fee_types FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_types_update ON fee_types FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY fee_types_delete ON fee_types FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- attendance
CREATE POLICY attendance_select ON attendance FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY attendance_insert ON attendance FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY attendance_update ON attendance FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY attendance_delete ON attendance FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- exams
CREATE POLICY exams_select ON exams FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY exams_insert ON exams FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY exams_update ON exams FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY exams_delete ON exams FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- marks
CREATE POLICY marks_select ON marks FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY marks_insert ON marks FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY marks_update ON marks FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY marks_delete ON marks FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- subjects
CREATE POLICY subjects_select ON subjects FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY subjects_insert ON subjects FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY subjects_update ON subjects FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY subjects_delete ON subjects FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- divisions
CREATE POLICY divisions_select ON divisions FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY divisions_insert ON divisions FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY divisions_update ON divisions FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY divisions_delete ON divisions FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- streams
CREATE POLICY streams_select ON streams FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY streams_insert ON streams FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY streams_update ON streams FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY streams_delete ON streams FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- teacher_subjects
CREATE POLICY teacher_subjects_select ON teacher_subjects FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teacher_subjects_insert ON teacher_subjects FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teacher_subjects_update ON teacher_subjects FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY teacher_subjects_delete ON teacher_subjects FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- trust_info
CREATE POLICY trust_info_select ON trust_info FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_insert ON trust_info FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_update ON trust_info FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_delete ON trust_info FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- ===== STORAGE =====

-- Create the school-files bucket (used for all file uploads: logos, photos, receipts, etc.)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'school-files',
  'school-files',
  true,
  false,
  5242880,
  '{image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf}'
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects
-- Update bucket to public if it already exists
UPDATE storage.buckets SET public = true WHERE id = 'school-files';

CREATE POLICY "authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school-files');

CREATE POLICY "public can view school files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'school-files');

CREATE POLICY "authenticated users can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'school-files');
