# School ERP — Functional Requirements Specification

## 1. System Overview

A multi-tenant school management system (ERP) with role-based access (Admin / Teacher). Built as a Next.js (App Router) full-stack application with Supabase (PostgreSQL) as the database. Each school gets its own data scope via `school_id`. Supabase Row-Level Security (RLS) policies enforce data isolation at the database level.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| UI | Tailwind CSS, shadcn/ui (recommended) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) — built-in session management |
| ORM/DB Client | `@supabase/supabase-js` (server-side client) + `@supabase/ssr` (Next.js auth helpers) |
| File Storage | Supabase Storage (instead of local filesystem) |
| Excel | xlsx (SheetJS) |
| PDF | PDFKit (in API route handlers) |
| Deployment | Vercel (optimized for Next.js) |

---

## 3. Database Tables (Supabase)

All tables have `school_id` column (nullable FK to `school_info`) for multi-tenancy. Row-Level Security (RLS) policies use Supabase Auth (`auth.uid()`) and a custom `school_id` claim to restrict data access per school. No backend middleware needed — RLS is enforced at the database level.

### 3.1 `school_info`
| Column | Type |
|--------|------|
| id | bigint PK |
| school_name | text |
| address | text |
| phone | text |
| email | text |
| website | text |
| principal_name | text |
| affiliation | text |
| logo_url | text |
| updated_at | timestamp |

### 3.2 `users`
| Column | Type |
|--------|------|
| id | bigint PK |
| email | text UNIQUE |
| password | text (bcrypt hash) |
| full_name | text |
| role | text — `"admin"` or `"teacher"` |
| teacher_id | bigint FK → teachers.id (nullable) |
| class_name | text (nullable, for class-restricted admin) |
| school_id | bigint FK → school_info.id |

### 3.3 `students`
| Column | Type |
|--------|------|
| id | bigint PK |
| admission_no | text |
| full_name | text |
| gender | text |
| father_name | text |
| mother_name | text |
| dob | date |
| birthplace | text |
| mobile | text |
| address | text |
| village | text |
| district | text |
| city | text |
| last_school | text |
| division | text |
| class_name | text (string "1"–"12") |
| stream | text |
| roll_no | integer |
| academic_year_id | bigint FK → academic_years.id |
| photo_url | text |
| birth_cert_url | text |
| aadhar_url | text |
| father_aadhar_url | text |
| school_id | bigint FK |

### 3.4 `teachers`
| Column | Type |
|--------|------|
| id | bigint PK |
| full_name | text |
| subject | text |
| mobile | text |
| salary | numeric |
| school_id | bigint FK |

### 3.5 `fees`
| Column | Type |
|--------|------|
| id | bigint PK |
| student_id | bigint FK → students.id |
| amount | numeric |
| status | text — `"Paid"`, `"Pending"`, `"Partial"` |
| payment_date | timestamp |
| payment_mode | text — `"Cash"`, `"Online"`, `"Cheque"` |
| transaction_id | text |
| cheque_number | text |
| cheque_date | date |
| bank_name | text |
| particulars | jsonb (array of `{particular_name, amount}`) |
| school_id | bigint FK |

### 3.6 `attendance`
| Column | Type |
|--------|------|
| id | bigint PK |
| student_id | bigint FK → students.id |
| attendance_date | date |
| status | text — `"Present"`, `"Absent"`, `"Late"`, `"Leave"` |
| school_id | bigint FK |

### 3.7 `exams`
| Column | Type |
|--------|------|
| id | bigint PK |
| exam_name | text |
| class_name | text |
| school_id | bigint FK |

### 3.8 `marks`
| Column | Type |
|--------|------|
| id | bigint PK |
| student_id | bigint FK → students.id |
| exam_id | bigint FK → exams.id |
| subject | text |
| marks | numeric |
| school_id | bigint FK |

### 3.9 `subjects`
| Column | Type |
|--------|------|
| id | bigint PK |
| class_name | text |
| subject_name | text |
| school_id | bigint FK |

### 3.10 `academic_years`
| Column | Type |
|--------|------|
| id | bigint PK |
| year_name | text (e.g. "2025-26") |
| start_date | date |
| end_date | date |
| is_active | boolean |
| school_id | bigint FK |

### 3.11 `divisions`
| Column | Type |
|--------|------|
| id | bigint PK |
| class_name | text |
| division_name | text (e.g. "A", "B") |
| class_teacher_id | bigint FK → teachers.id |
| school_id | bigint FK |

### 3.12 `streams`
| Column | Type |
|--------|------|
| id | bigint PK |
| class_name | text |
| stream_name | text (e.g. "Science", "Commerce") |
| school_id | bigint FK |

### 3.13 `fee_particulars`
| Column | Type |
|--------|------|
| id | bigint PK |
| class_name | text |
| particular_name | text (e.g. "Tuition Fee") |
| amount | numeric |
| school_id | bigint FK |

### 3.14 `teacher_subjects`
| Column | Type |
|--------|------|
| id | bigint PK |
| teacher_id | bigint FK → teachers.id |
| class_name | text |
| subject | text |
| school_id | bigint FK |

---

## 4. Authentication & Authorization

### 4.1 Auth Strategy
- **Supabase Auth** with email/password authentication
- Session managed via `@supabase/ssr` cookies (server-side) — no manual JWT handling
- User metadata stored in Supabase `auth.users` + a `public.users` table (or use raw user metadata)
- Custom claims (`role`, `school_id`, `teacher_id`) stored in user metadata or a public `profiles` table

### 4.2 Public Routes
These are accessible without authentication:
- `/login` — login page
- `/signup` — registration page
- `/forgot-password` — reset request page
- `/api/school-info` — list all schools (server action or route handler)

### 4.3 Protected Routes
All other pages redirect unauthenticated users to `/login`.  
API route handlers check session via `createRouteHandlerClient()` from `@supabase/ssr`.

### 4.4 Role-Based UI Check
- Server Components check `session.user.user_metadata.role` (or query `public.users`)
- Client Components use a `useUser()` hook (from Supabase Auth context provider)
- **Admin** sees all 15 pages: Dashboard, Students, Teachers, Fees, Fee Particulars, Attendance, Exams, Marks, Dynamic Form, Academic Years, Divisions, Subjects, Streams, Teacher Subjects, School Info
- **Teacher** sees 6 pages: Dashboard, Students, Fees, Attendance, Exams, Marks
- **Class-restricted admin**: admins with `class_name` set are limited to that class in the Dashboard

---

## 5. Frontend Pages / Modules

### 5.1 Login (`/login`)
- Email + password form
- Uses `supabase.auth.signInWithPassword()`
- Links: "Create account" → `/signup`, "Forgot password?" → `/forgot-password`
- On success: Supabase stores session cookie, redirects to `/dashboard`

### 5.2 Signup (`/signup`)
- Fields: Full Name, Email, Password, Role (Teacher/Admin)
- If Teacher: optional link to existing teacher record
- School selector (dropdown from `school_info` table via server action)
- If Admin: optional class restriction selector
- Uses `supabase.auth.signUp()`, then inserts profile into `public.users` table via server action
- On success: auto-login, redirect to `/dashboard`

### 5.3 Forgot Password (`/forgot-password`)
- Two-step: enter email → Supabase sends reset email (or generates reset link) → enter new password
- Uses `supabase.auth.resetPasswordForEmail()`

### 5.4 Dashboard
- **School summary card** (school name, total students)
- **Class-wise student count cards** (clickable)
- **Division-wise details table** with class teacher name, expandable student lists
- **Class-wise fee status** (Paid/Unpaid breakdown per class)

### 5.5 Students (CRUD)
- Table with columns: #, Roll No, Photo, Name, Gender, Father, Mother, DOB, Class, Division, Stream, Year, City, Actions
- Filters: search (text), class, division, stream, academic year
- Add/Edit modal with fields:
  - School, Name*, Gender, Father, Mother, DOB, Birth Place, Address, Village, District, City, Last School, Roll No, Class*, Division, Stream, Academic Year
  - File uploads: Photo, Birth Certificate, Aadhar, Father's Aadhar
- Detail view modal (click name)
- Delete with confirmation
- Excel import/export via template

### 5.6 Teachers (CRUD)
- Table: #, Name, Subject, Mobile, Salary, Actions
- Search filter
- Add/Edit modal: Name*, Subject, Mobile, Salary

### 5.7 Fees
- Table: #, Student, Amount, Status, Mode, Payment Date, Actions (Edit, Delete, Receipt, Download)
- Filters: search, class, division, academic year
- Add/Edit modal:
  - Student selector (filtered by class/div/year)
  - Auto-populated fee particulars from `fee_particulars` table for that class
  - Dynamic amounts per particular, auto-total
  - Status: Paid/Pending/Partial
  - Payment Mode: Cash / Online (txn ID) / Cheque (cheque no, date, bank)
  - Payment Date
- **PDF Receipt** (GET `/api/fees/receipt/:id`): full-page A4 PDF with school header, student details, particulars table, totals, office copy + student copy
- **Excel Report Download** (GET `/api/fees/export`): filtered by class/division/year/status, includes student info

### 5.8 Fee Particulars (CRUD)
- Grouped by class
- Fields: Class*, Particular Name*, Amount*

### 5.9 Attendance (CRUD)
- Table: #, Student, Date, Status, Actions
- Filters: search, class, division
- Status options: Present, Absent, Late, Leave

### 5.10 Exams (CRUD)
- Table: #, Exam Name, Class, Created At, Actions
- Filters: search

### 5.11 Marks (CRUD)
- Table: #, Student, Exam, Subject, Teacher (from teacher_subjects), Marks, Actions
- Filters: search, class, division
- Shows assigned teacher name when student class + subject matches a `teacher_subjects` record

### 5.12 Academic Years (CRUD)
- Table: #, Year, Start Date, End Date, Status (Active/Inactive), Actions
- **Activate** — sets one year active, all others inactive
- **Promote Students** — copies all students from a source academic year to a target year, incrementing `class_name` by 1 (e.g. class 3 → class 4)

### 5.13 Divisions (CRUD)
- Grouped by class
- Fields: Class*, Division Name*, Class Teacher (dropdown from teachers)

### 5.14 Subjects (CRUD)
- Grouped by class
- Fields: Class*, Subject Name*

### 5.15 Streams (CRUD)
- Grouped by class
- Fields: Class*, Stream Name*

### 5.16 Teacher Subjects (assignments)
- Table by class: Teacher, Subject, Actions (Remove only — no edit)
- Add modal: Teacher*, Class*, Subject*

### 5.17 School Info (CRUD)
- Card grid view: school name, principal, phone, email, website, affiliation, address, logo
- Add/Edit modal: School Name*, Phone, Email, Website, Principal, Affiliation, Address, Logo (file upload)

### 5.18 Dynamic Form Builder
- Add custom fields: name, label, type (text/number/date/email/textarea/select), placeholder, required, options (for select)
- Reorder fields (up/down)
- Preview rendered form
- Submit shows JSON output (no persistence)

---

## 6. File Uploads

- **Supabase Storage** stores files in a dedicated bucket (e.g. `school-files`)
- Public bucket with RLS policies restricting uploads to authenticated users
- Allowed: jpeg, jpg, png, gif, webp, PDF — max 5MB
- Uploads performed client-side via `supabase.storage.from('school-files').upload()`
- Returned public URL stored in the corresponding database row (e.g. `students.photo_url`)
- File structure in bucket: `{school_id}/{entity}/{userId}_{timestamp}_{filename}`
- No separate upload API endpoint needed — Supabase Storage is accessed directly from the client

---

## 7. Excel Import/Export

Handled via Next.js Route Handlers (`app/api/...`).

### 7.1 Templates (download)
- `GET /api/excel/template/[entity]` — returns `.xlsx` with header row
- Supported entities: students, teachers, fees, attendance, exams, marks

### 7.2 Import
- `POST /api/excel/import/[entity]` — upload `.xlsx`, parses rows, bulk inserts via Supabase server client
- Returns `{ imported, errors, errorDetails }`

### 7.3 Fees Export
- `GET /api/fees/export?class_name=&division=&academic_year_id=&status=` → `.xlsx`

---

## 8. PDF Receipt

- Route handler: `GET /api/fees/receipt/[id]?download=1`
- Uses PDFKit in a Next.js Route Handler (`app/api/fees/receipt/[id]/route.ts`)
- Checks session via Supabase server client
- Generates A4 PDF with:
  - School header (name, address, phone, email)
  - "FEE RECEIPT" title
  - Office Copy + Student's Copy (separated by cut line)
  - Receipt #, Date, Student details box, Particulars table, Total, Status, Payment mode info, Signature line

---

## 9. Multi-Tenancy (School Scoping)

Every data table has a `school_id` FK column. Data isolation is enforced at two levels:

### 9.1 Supabase RLS Policies
Row-Level Security policies compare `school_id` against the user's `school_id` claim (stored in `auth.users.raw_user_meta_data` or a `public.users` table). Example policy:
```sql
CREATE POLICY "users can only see their school's data"
ON students FOR ALL
USING (school_id = (SELECT raw_user_meta_data->>'school_id' FROM auth.users WHERE id = auth.uid())::bigint);
```

### 9.2 Server-Side Filtering
Next.js Server Components and Route Handlers use `createServerComponentClient()` or `createRouteHandlerClient()` from `@supabase/ssr`, then append `.eq('school_id', user.school_id)` to every query. A shared utility function (`filterBySchool(query, schoolId)`) handles this.

---

## 10. Global UI/UX Patterns

- Tailwind CSS with shadcn/ui components (recommended), slate/blue color scheme
- React Server Components for data-fetching pages; Client Components only where interactivity is needed
- Consistent CRUD pattern: modal/dialog for add/edit, inline delete with confirm
- Search bars and filter dropdowns on all list pages (client-side filtering for small datasets, server-side for large)
- Responsive sidebar navigation using Next.js Layout (Admin: 15 pages, Teacher: 6 pages)
- Loading states via `loading.tsx` and `React.Suspense`
- Error boundaries via `error.tsx`
- All text inputs auto-uppercase via JS `.toUpperCase()` (except email/password fields)

---

## 11. Users & Roles

- **Admin**: full access to all modules; can be class-restricted (e.g. "Class 6 Admin")
- **Teacher**: limited to Dashboard, Students, Fees, Attendance, Exams, Marks
- Teacher's Dashboard auto-filters to their assigned class (via `class_teacher_id` in divisions)

---

## 12. Key Business Rules

- Student roll_no auto-assigned (max +1 per class+division)
- Fee particulars auto-populate from `fee_particulars` when a student is selected
- Marks page shows teacher name from `teacher_subjects` assignments
- Academic year promotion copies students to next class in a new year
- Only one academic year can be active at a time
- Receipt PDF shows both office copy and student copy in one print

---

## 13. Project Structure (Next.js App Router)

```
/
├── app/
│   ├── layout.tsx              # Root layout — Supabase Auth listener provider
│   ├── page.tsx                # Redirect to /login or /dashboard
│   ├── loading.tsx             # Global loading state
│   ├── error.tsx               # Global error boundary
│   ├── globals.css             # Tailwind CSS directives
│   ├── login/
│   │   └── page.tsx            # Login page (client component)
│   ├── signup/
│   │   └── page.tsx            # Signup page (client component)
│   ├── forgot-password/
│   │   └── page.tsx            # Forgot password page
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard (server component w/ client sub-components)
│   ├── students/
│   │   ├── page.tsx            # Students list (server component)
│   │   └── actions.ts          # Server Actions for CRUD
│   ├── teachers/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── fees/
│   │   ├── page.tsx
│   │   ├── actions.ts
│   │   └── receipt/
│   │       └── [id]/route.ts   # PDF receipt route handler
│   ├── attendance/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── exams/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── marks/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── academic-years/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── divisions/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── subjects/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── streams/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── teacher-subjects/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── fee-particulars/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── school-info/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── dynamic-form/
│   │   └── page.tsx
│   └── api/
│       ├── excel/
│       │   ├── template/[entity]/route.ts
│       │   └── import/[entity]/route.ts
│       └── fees/
│           └── receipt/[id]/route.ts
├── components/
│   ├── ui/                     # shadcn/ui components (button, dialog, table, etc.)
│   ├── layout/
│   │   ├── sidebar.tsx         # Sidebar navigation (client component)
│   │   └── auth-provider.tsx   # Supabase Auth context provider
│   ├── students/
│   │   ├── student-table.tsx   # Client component: table + filters
│   │   ├── student-modal.tsx   # Client component: add/edit dialog
│   │   └── student-detail.tsx  # Client component: detail view
│   ├── fees/
│   │   ├── fee-table.tsx
│   │   ├── fee-modal.tsx
│   │   └── ... (per entity)
│   └── excel-actions.tsx       # Excel download/upload buttons
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client (createBrowserClient)
│   │   ├── server.ts           # Server component client (createServerComponentClient)
│   │   └── admin.ts            # Service-role client (for admin operations)
│   ├── utils.ts                # Shared helpers (cn, etc.)
│   └── school-query.ts         # filterBySchool() utility
├── types/
│   └── database.ts             # Generated Supabase types
├── middleware.ts               # Next.js middleware — session refresh + route protection
├── supabase/
│   └── schema.sql              # Full DDL + RLS policies
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 14. Server Actions & Route Handlers Summary

### 14.1 Server Actions (CRUD — data mutations)

All CRUD operations are implemented as **Next.js Server Actions** (`"use server"` functions in `actions.ts` files). They:
- Run on the server, never exposed as REST endpoints
- Use `createServerActionClient()` from `@supabase/ssr` to get the authenticated session
- Return `{ success, message, data }` objects
- Are called directly from Client Components via `import { addStudent } from './actions'`

| Server Action | Module | Purpose |
|---------------|--------|---------|
| `addStudent(data)` | `app/students/actions.ts` | Create student |
| `getAllStudents()` | `app/students/actions.ts` | List students |
| `updateStudent(id, data)` | `app/students/actions.ts` | Update student |
| `deleteStudent(id)` | `app/students/actions.ts` | Delete student |
| `addTeacher(data)` | `app/teachers/actions.ts` | Create teacher |
| `getAllTeachers()` | `app/teachers/actions.ts` | List teachers |
| `updateTeacher(id, data)` | `app/teachers/actions.ts` | Update teacher |
| `deleteTeacher(id)` | `app/teachers/actions.ts` | Delete teacher |
| `addFee(data)` | `app/fees/actions.ts` | Create fee |
| `getAllFees()` | `app/fees/actions.ts` | List fees |
| `getFeesByStudent(studentId)` | `app/fees/actions.ts` | Fees by student |
| `updateFee(id, data)` | `app/fees/actions.ts` | Update fee |
| `deleteFee(id)` | `app/fees/actions.ts` | Delete fee |
| `addAttendance(data)` | `app/attendance/actions.ts` | Create attendance |
| `getAllAttendance()` | `app/attendance/actions.ts` | List attendance |
| `updateAttendance(id, data)` | `app/attendance/actions.ts` | Update attendance |
| `deleteAttendance(id)` | `app/attendance/actions.ts` | Delete attendance |
| `addExam(data)` | `app/exams/actions.ts` | Create exam |
| `getAllExams()` | `app/exams/actions.ts` | List exams |
| `updateExam(id, data)` | `app/exams/actions.ts` | Update exam |
| `deleteExam(id)` | `app/exams/actions.ts` | Delete exam |
| `addMark(data)` | `app/marks/actions.ts` | Create mark |
| `getAllMarks()` | `app/marks/actions.ts` | List marks |
| `updateMark(id, data)` | `app/marks/actions.ts` | Update mark |
| `deleteMark(id)` | `app/marks/actions.ts` | Delete mark |
| `addSubject(data)` | `app/subjects/actions.ts` | Create subject |
| `getAllSubjects()` | `app/subjects/actions.ts` | List subjects |
| `updateSubject(id, data)` | `app/subjects/actions.ts` | Update subject |
| `deleteSubject(id)` | `app/subjects/actions.ts` | Delete subject |
| `addAcademicYear(data)` | `app/academic-years/actions.ts` | Create year |
| `getAllAcademicYears()` | `app/academic-years/actions.ts` | List years |
| `updateAcademicYear(id, data)` | `app/academic-years/actions.ts` | Update year |
| `setActiveAcademicYear(id)` | `app/academic-years/actions.ts` | Set active year |
| `deleteAcademicYear(id)` | `app/academic-years/actions.ts` | Delete year |
| `promoteStudents(fromYearId, toYearId)` | `app/academic-years/actions.ts` | Promote students |
| `addDivision(data)` | `app/divisions/actions.ts` | Create division |
| `getAllDivisions()` | `app/divisions/actions.ts` | List divisions |
| `updateDivision(id, data)` | `app/divisions/actions.ts` | Update division |
| `deleteDivision(id)` | `app/divisions/actions.ts` | Delete division |
| `addStream(data)` | `app/streams/actions.ts` | Create stream |
| `getAllStreams()` | `app/streams/actions.ts` | List streams |
| `updateStream(id, data)` | `app/streams/actions.ts` | Update stream |
| `deleteStream(id)` | `app/streams/actions.ts` | Delete stream |
| `addFeeParticular(data)` | `app/fee-particulars/actions.ts` | Create particular |
| `getAllFeeParticulars()` | `app/fee-particulars/actions.ts` | List particulars |
| `updateFeeParticular(id, data)` | `app/fee-particulars/actions.ts` | Update particular |
| `deleteFeeParticular(id)` | `app/fee-particulars/actions.ts` | Delete particular |
| `addTeacherSubject(data)` | `app/teacher-subjects/actions.ts` | Create assignment |
| `getAllTeacherSubjects()` | `app/teacher-subjects/actions.ts` | List assignments |
| `deleteTeacherSubject(id)` | `app/teacher-subjects/actions.ts` | Remove assignment |
| `upsertSchoolInfo(data)` | `app/school-info/actions.ts` | Create/update school |
| `getAllSchools()` | `app/school-info/actions.ts` | List schools |
| `getSchool(id)` | `app/school-info/actions.ts` | Get single school |
| `deleteSchool(id)` | `app/school-info/actions.ts` | Delete school |

### 14.2 Route Handlers (file downloads / binary responses)

For operations that return binary files (PDF, Excel), Next.js Route Handlers are used:

| Method | Route Handler | Purpose |
|--------|---------------|---------|
| GET | `app/api/fees/receipt/[id]/route.ts` | Generate & return PDF receipt |
| GET | `app/api/excel/template/[entity]/route.ts` | Download Excel template |
| POST | `app/api/excel/import/[entity]/route.ts` | Upload & import Excel file |

### 14.3 Authentication (Supabase Auth)

Supabase handles all auth — no custom endpoints needed:

| Operation | Method |
|-----------|--------|
| Login | `supabase.auth.signInWithPassword()` in client component |
| Signup | `supabase.auth.signUp()` in client component + server action to create profile |
| Logout | `supabase.auth.signOut()` in client component |
| Session check | `createServerComponentClient()` in Server Components |
| Session refresh | Next.js Middleware (`middleware.ts`) refreshes session on each request |
| Password reset | `supabase.auth.resetPasswordForEmail()` |

---

**End of specification.**
