-- Timetable entries: one row per class+division+day+period
CREATE TABLE IF NOT EXISTS timetables (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  school_id bigint REFERENCES school_info(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  division text DEFAULT '',
  day text NOT NULL,
  period_no integer NOT NULL,
  start_time text,
  end_time text,
  subject_id bigint REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id bigint REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now()
);

ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetables_select ON timetables
  FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY timetables_insert ON timetables
  FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY timetables_update ON timetables
  FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');

CREATE POLICY timetables_delete ON timetables
  FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');

-- Prevent duplicate entries for the same class/division/day/period
CREATE UNIQUE INDEX IF NOT EXISTS timetables_class_day_period_uidx
  ON timetables (school_id, class_name, division, day, period_no);
