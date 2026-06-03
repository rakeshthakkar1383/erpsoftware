-- 1. Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add new roles to check constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'teacher', 'authority', 'principal', 'supervision', 'student'));

-- 3. Add student_id and visibility flags
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS student_id bigint REFERENCES students(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS can_see_all_data boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 4. Update get_user_role helper to be more descriptive if needed, 
-- but current one just returns the role string from JWT, which is fine.
