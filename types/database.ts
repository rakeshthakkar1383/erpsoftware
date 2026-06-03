export interface SchoolInfo {
  id: number
  school_name: string | null
  trust_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  principal_name: string | null
  affiliation: string | null
  logo_url: string | null
  updated_at: string | null
}

export interface User {
  id: number
  email: string
  password: string
  full_name: string
  role: "admin" | "teacher"
  teacher_id: number | null
  class_name: string | null
  school_id: number | null
}

export interface Student {
  id: number
  admission_no: string | null
  full_name: string | null
  gender: string | null
  father_name: string | null
  mother_name: string | null
  dob: string | null
  birthplace: string | null
  mobile: string | null
  address: string | null
  village: string | null
  district: string | null
  city: string | null
  last_school: string | null
  division: string | null
  class_name: string | null
  stream: string | null
  roll_no: number | null
  academic_year_id: number | null
  photo_url: string | null
  birth_cert_url: string | null
  aadhar_url: string | null
  father_aadhar_url: string | null
  school_id: number | null
  created_at?: string
}

export interface Teacher {
  id: number
  full_name: string | null
  subject: string | null
  mobile: string | null
  salary: number | null
  school_id: number | null
}

export interface Fee {
  id: number
  student_id: number | null
  trust_id: number | null
  fee_type_id: number | null
  fee_category: string | null
  amount: number | null
  status: string | null
  payment_date: string | null
  payment_mode: string | null
  transaction_id: string | null
  cheque_number: string | null
  cheque_date: string | null
  bank_name: string | null
  particulars: any
  receipt_file_url: string | null
  school_id: number | null
  created_at?: string
}

export interface FeeParticular {
  id: number
  class_name: string | null
  particular_name: string | null
  amount: number | null
  duration_months: number | null
  fee_type_id: number | null
  fee_category: string | null
  school_id: number | null
  trust_id: number | null
}

export interface FeeInstallment {
  id: number
  fee_id: number | null
  month_number: number
  due_date: string | null
  amount: number | null
  status: string | null
  paid_date: string | null
  payment_mode: string | null
  transaction_id: string | null
  school_id: number | null
  created_at?: string
}

export interface FeeType {
  id: number
  name: string | null
  description: string | null
  school_id: number | null
  is_active: boolean | null
  created_at?: string
}

export interface Attendance {
  id: number
  student_id: number | null
  attendance_date: string | null
  status: string | null
  school_id: number | null
}

export interface Exam {
  id: number
  exam_name: string | null
  class_name: string | null
  school_id: number | null
  created_at?: string
}

export interface Mark {
  id: number
  student_id: number | null
  exam_id: number | null
  subject: string | null
  marks: number | null
  school_id: number | null
}

export interface Subject {
  id: number
  class_name: string | null
  subject_name: string | null
  school_id: number | null
}

export interface AcademicYear {
  id: number
  year_name: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean | null
  school_id: number | null
}

export interface Division {
  id: number
  class_name: string | null
  division_name: string | null
  class_teacher_id: number | null
  school_id: number | null
  teachers?: { full_name: string | null } | null
}

export interface Stream {
  id: number
  class_name: string | null
  stream_name: string | null
  school_id: number | null
}

export interface TeacherSubject {
  id: number
  teacher_id: number | null
  class_name: string | null
  subject: string | null
  school_id: number | null
  teachers?: { full_name: string | null } | null
}
