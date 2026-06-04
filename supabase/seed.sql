-- Seed data for development
-- Run via: supabase db reset, or in SQL editor with service_role (RLS bypass)

-- Temporarily disable RLS for seeding (runs as service_role in supabase db reset)
ALTER TABLE school_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE trust_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE fees DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_particulars DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE divisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects DISABLE ROW LEVEL SECURITY;

-- Helper to clear existing data
TRUNCATE TABLE trust_info, students, teachers, fees, fee_particulars, fee_types, attendance, exams, marks, subjects, divisions, streams, teacher_subjects, users RESTART IDENTITY CASCADE;

-- 1. school_info
INSERT INTO school_info (school_name, address, phone, email, website, principal_name, affiliation)
VALUES ('Springfield Elementary School', '123 Main St, Springfield', '1234567890', 'info@springfield.edu', 'https://springfield.edu', 'Dr. Principal', 'CBSE');

-- 2. users (password: hashed placeholder — replace with actual hash)
INSERT INTO users (email, password, full_name, role, school_id)
VALUES ('admin@school.com', '$2a$10$placeholderhash', 'Admin User', 'admin', 1);

-- 3. trust_info
INSERT INTO trust_info (trust_name, address, phone, email, website, registration_no, school_id)
VALUES ('Springfield Education Trust', '123 Main St, Springfield', '1234567890', 'trust@springfield.edu', 'https://springfield.edu', 'TRUST-001', 1);

-- 4. teachers
INSERT INTO teachers (full_name, subject, mobile, school_id)
VALUES ('John Teacher', 'Mathematics', '1111111111', 1),
       ('Sarah Teacher', 'English', '2222222222', 1),
       ('David Teacher', 'Science', '3333333333', 1);

-- 5. divisions
INSERT INTO divisions (class_name, division_name, class_teacher_id, school_id)
VALUES ('10', 'A', 1, 1), ('10', 'B', 2, 1), ('10', 'C', 3, 1);

-- 6. streams
INSERT INTO streams (class_name, stream_name, school_id) VALUES ('10', 'Science', 1), ('11', 'Commerce', 1), ('12', 'Arts', 1);

-- 7. subjects
INSERT INTO subjects (class_name, subject_name, school_id) VALUES ('10', 'Mathematics', 1), ('10', 'English', 1), ('10', 'Science', 1);

-- 8. students
INSERT INTO students (admission_no, full_name, gender, father_name, mother_name, class_name, mobile, school_id)
VALUES ('ADM001', 'Alice Student', 'Female', 'Father A', 'Mother A', '10', '9999999999', 1),
       ('ADM002', 'Bob Student', 'Male', 'Father B', 'Mother B', '10', '8888888888', 1),
       ('ADM003', 'Charlie Student', 'Male', 'Father C', 'Mother C', '10', '7777777777', 1);

-- 9. fee_types
INSERT INTO fee_types (name, school_id) VALUES ('Tuition Fee', 1), ('Bus Fee', 1), ('Library Fee', 1);

-- Add trust fee types
INSERT INTO fee_types (name, fee_category, trust_id, school_id) VALUES ('Trust Tuition', 'Trust', 1, 1), ('Trust Activity', 'Trust', 1, 1);

-- 10. fee_particulars
INSERT INTO fee_particulars (class_name, particular_name, amount, duration_months, school_id) VALUES ('10', 'Tuition Monthly', 5000, 12, 1), ('10', 'Bus Monthly', 2000, 12, 1);

-- Trust fee particulars with first term / second term distinction
INSERT INTO fee_particulars (class_name, particular_name, amount, duration_months, term, fee_category, trust_id, school_id) VALUES ('10', 'Trust Tuition', 3000, 6, 'First Term', 'Trust', 1, 1);
INSERT INTO fee_particulars (class_name, particular_name, amount, duration_months, term, fee_category, trust_id, school_id) VALUES ('10', 'Trust Tuition', 5000, 6, 'Second Term', 'Trust', 1, 1);
INSERT INTO fee_particulars (class_name, particular_name, amount, duration_months, term, fee_category, trust_id, school_id) VALUES ('10', 'Trust Activity Fee', 1000, 6, 'First Term', 'Trust', 1, 1);
INSERT INTO fee_particulars (class_name, particular_name, amount, duration_months, term, fee_category, trust_id, school_id) VALUES ('10', 'Trust Activity Fee', 1500, 6, 'Second Term', 'Trust', 1, 1);

-- 11. fees
INSERT INTO fees (student_id, fee_type_id, fee_category, amount, status, school_id)
VALUES (1, 1, 'School', 5000, 'Paid', 1),
       (1, 2, 'School', 2000, 'Paid', 1),
       (2, 1, 'School', 5000, 'Paid', 1),
       (3, 1, 'School', 5000, 'Pending', 1);

-- 12. attendance
INSERT INTO attendance (student_id, attendance_date, status, school_id)
VALUES (1, '2026-06-01', 'Present', 1), (1, '2026-06-02', 'Present', 1), (1, '2026-06-03', 'Absent', 1),
       (2, '2026-06-01', 'Present', 1), (2, '2026-06-02', 'Absent', 1), (2, '2026-06-03', 'Present', 1),
       (3, '2026-06-01', 'Present', 1), (3, '2026-06-02', 'Present', 1), (3, '2026-06-03', 'Present', 1);

-- 13. exams
INSERT INTO exams (exam_name, class_name, school_id)
VALUES ('Mid Term 2026', '10', 1), ('Final Term 2026', '10', 1);

-- 14. marks
INSERT INTO marks (student_id, exam_id, subject, marks, school_id)
VALUES (1, 1, 'Mathematics', 85, 1), (1, 1, 'English', 78, 1), (1, 1, 'Science', 92, 1),
       (2, 1, 'Mathematics', 72, 1), (2, 1, 'English', 88, 1), (2, 1, 'Science', 65, 1),
       (3, 1, 'Mathematics', 95, 1), (3, 1, 'English', 91, 1), (3, 1, 'Science', 89, 1);

-- 15. teacher_subjects
INSERT INTO teacher_subjects (teacher_id, class_name, subject, school_id)
VALUES (1, '10', 'Mathematics', 1), (2, '10', 'English', 1), (3, '10', 'Science', 1);

-- Re-enable RLS
ALTER TABLE school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_particulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
