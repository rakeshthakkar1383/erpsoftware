-- Fix get_school_id() to handle empty string school_id in JWT metadata
-- Previously ""::bigint would throw "invalid input syntax for type bigint"
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
