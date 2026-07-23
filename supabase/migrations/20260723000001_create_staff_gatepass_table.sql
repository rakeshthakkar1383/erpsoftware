CREATE TABLE IF NOT EXISTS staff_gatepass (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  teacher_id bigint REFERENCES teachers(id) ON DELETE CASCADE,
  out_time text NOT NULL,
  in_time text,
  reason text,
  permission_given_by text,
  permission_signature text,
  staff_signature text,
  status text DEFAULT 'Active',
  created_at timestamp DEFAULT now()
);

ALTER TABLE staff_gatepass ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_gatepass_select ON staff_gatepass
  FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY staff_gatepass_insert ON staff_gatepass
  FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY staff_gatepass_update ON staff_gatepass
  FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY staff_gatepass_delete ON staff_gatepass
  FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');
