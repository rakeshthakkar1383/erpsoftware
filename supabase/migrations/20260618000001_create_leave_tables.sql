-- Create leave_types table
CREATE TABLE IF NOT EXISTS leave_types (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  short_code text,
  description text,
  max_days integer DEFAULT 0,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  applicant_type text NOT NULL CHECK (applicant_type IN ('student', 'teacher')),
  applicant_id bigint NOT NULL,
  leave_type_id bigint REFERENCES leave_types(id) ON DELETE SET NULL,
  from_date text NOT NULL,
  to_date text NOT NULL,
  days integer NOT NULL DEFAULT 1,
  reason text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
  remarks text,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS leave_types_select ON leave_types;
DROP POLICY IF EXISTS leave_types_insert ON leave_types;
DROP POLICY IF EXISTS leave_types_update ON leave_types;
DROP POLICY IF EXISTS leave_types_delete ON leave_types;
DROP POLICY IF EXISTS leaves_select ON leaves;
DROP POLICY IF EXISTS leaves_insert ON leaves;
DROP POLICY IF EXISTS leaves_update ON leaves;
DROP POLICY IF EXISTS leaves_delete ON leaves;

-- RLS policies for leave_types
CREATE POLICY leave_types_select ON leave_types FOR SELECT USING (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));
CREATE POLICY leave_types_insert ON leave_types FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));
CREATE POLICY leave_types_update ON leave_types FOR UPDATE USING (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));
CREATE POLICY leave_types_delete ON leave_types FOR DELETE USING (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));

-- RLS policies for leaves
CREATE POLICY leaves_select ON leaves FOR SELECT USING (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));
CREATE POLICY leaves_insert ON leaves FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));
CREATE POLICY leaves_update ON leaves FOR UPDATE USING (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));
CREATE POLICY leaves_delete ON leaves FOR DELETE USING (school_id = get_school_id() OR get_user_role() IN ('admin', 'authority'));
