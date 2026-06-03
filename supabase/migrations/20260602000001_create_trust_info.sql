-- 1. Create trust_info table
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

ALTER TABLE trust_info ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_school_id()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'school_id')::bigint,
    0
  )
$$;

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

CREATE POLICY trust_info_select ON trust_info FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_insert ON trust_info FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_update ON trust_info FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_delete ON trust_info FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');
