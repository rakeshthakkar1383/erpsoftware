CREATE TABLE IF NOT EXISTS student_gatepass (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  student_id bigint REFERENCES students(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  visitor_mobile text,
  visitor_relation text,
  visitor_vehicle_no text,
  visitor_town_village text,
  gatepass_date text NOT NULL,
  reason text,
  visitor_photo_url text,
  visitor_signature text,
  permission_given_by text,
  permission_signature text,
  status text DEFAULT 'Active',
  created_at timestamp DEFAULT now()
);

ALTER TABLE student_gatepass ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_gatepass_select ON student_gatepass
  FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY student_gatepass_insert ON student_gatepass
  FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY student_gatepass_update ON student_gatepass
  FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY student_gatepass_delete ON student_gatepass
  FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');
