-- Fix trust_info RLS policies to allow admin users to manage trust info
-- Previously, superadmins (no school_id in JWT) could not insert/update trust_info
-- because get_school_id() returns 0 and the insert had the actual school_id

DROP POLICY IF EXISTS trust_info_select ON trust_info;
DROP POLICY IF EXISTS trust_info_insert ON trust_info;
DROP POLICY IF EXISTS trust_info_update ON trust_info;
DROP POLICY IF EXISTS trust_info_delete ON trust_info;

CREATE POLICY trust_info_select ON trust_info FOR SELECT USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_insert ON trust_info FOR INSERT WITH CHECK (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_update ON trust_info FOR UPDATE USING (school_id = get_school_id() OR get_user_role() = 'admin');
CREATE POLICY trust_info_delete ON trust_info FOR DELETE USING (school_id = get_school_id() OR get_user_role() = 'admin');
