ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS joining_date date,
ADD COLUMN IF NOT EXISTS retirement_date date,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS education_ssc text,
ADD COLUMN IF NOT EXISTS education_hsc text,
ADD COLUMN IF NOT EXISTS education_ug text,
ADD COLUMN IF NOT EXISTS education_pg text,
ADD COLUMN IF NOT EXISTS education_other text,
ADD COLUMN IF NOT EXISTS classes text, -- Comma separated or JSON
ADD COLUMN IF NOT EXISTS subjects text; -- Comma separated or JSON

-- Create a helper function if needed for age calculation, but we'll do it in JS for now.
