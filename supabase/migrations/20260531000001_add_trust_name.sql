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
