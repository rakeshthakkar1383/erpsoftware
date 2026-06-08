# Session Changelog

## 1. Fee Type checkboxes — show all relevant fee types
**File:** `app/fees/fees-client.tsx`
- Simplified `availableFeeTypeOptions` useMemo to show ALL fee types matching the category (School/Trust), removing the previous filter that only showed fee types with associated fee particulars.

## 2. Dynamic amount display next to fee type checkboxes
**File:** `app/fees/fees-client.tsx`
- Added `getFeeTypeAmount(feeTypeId)` helper that computes the total amount for a fee type by looking up fee particulars matching the current student's class and fee type ID.
- Updated fee type checkbox rendering to display `₹{amount}` next to each fee type name.
- Works for both new students (uses `form.class_name`) and old students (uses `studentMap[form.student_id].class_name`).

## 3. Added "Balvatika" as a pre-primary class option
**16 files updated:**
- `app/fees/fees-client.tsx`
- `app/admission/admission-client.tsx`
- `app/teachers/teachers-client.tsx`
- `app/students/students-client.tsx`
- `app/exams/exams-client.tsx`
- `app/attendance/attendance-client.tsx`
- `app/marksheet/marksheet-client.tsx`
- `app/fee-particulars/fee-particulars-client.tsx`
- `app/student-migration/student-migration-client.tsx`
- `app/dashboard/dashboard-client.tsx`
- `app/marks/marks-client.tsx`
- `app/teacher-subjects/teacher-subjects-client.tsx`
- `app/subjects/subjects-client.tsx`
- `app/streams/streams-client.tsx`
- `app/divisions/divisions-client.tsx`
- `app/signup/page.tsx`

Changed `Array.from({ length: 12 }, (_, i) => String(i + 1))` → `["Balvatika", ...Array.from({ length: 12 }, (_, i) => String(i + 1))]` in all files. "Balvatika" appears first in all class dropdowns.
