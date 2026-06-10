-- Fix RLS policies for school_info and trust_info to allow all authorized roles
-- Authority users should see everything, others should see their own school

-- 1. Update school_info policies
DROP POLICY IF EXISTS school_info_select ON school_info;
CREATE POLICY school_info_select ON school_info FOR SELECT USING (
  can_see_all() OR id = get_school_id()
);

-- 2. Update trust_info policies
DROP POLICY IF EXISTS trust_info_select ON trust_info;
CREATE POLICY trust_info_select ON trust_info FOR SELECT USING (
  can_see_all() OR school_id = get_school_id()
);
