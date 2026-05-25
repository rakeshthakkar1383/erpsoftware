const XLSX = require('xlsx');
const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

const templates = {
  students: {
    sheet: 'Students',
    columns: ['ROLL_NO', 'FULL_NAME', 'GENDER', 'FATHER_NAME', 'MOTHER_NAME', 'DOB', 'BIRTHPLACE', 'ADDRESS', 'VILLAGE', 'DISTRICT', 'CITY', 'LAST_SCHOOL', 'DIVISION', 'CLASS_NAME'],
    table: 'students',
    map: (r) => ({
      roll_no: r.ROLL_NO || null, full_name: r.FULL_NAME, gender: r.GENDER, father_name: r.FATHER_NAME,
      mother_name: r.MOTHER_NAME, dob: r.DOB, birthplace: r.BIRTHPLACE,
      address: r.ADDRESS, village: r.VILLAGE, district: r.DISTRICT,
      city: r.CITY, last_school: r.LAST_SCHOOL,
      division: r.DIVISION, class_name: r.CLASS_NAME
    })
  },
  teachers: {
    sheet: 'Teachers',
    columns: ['FULL_NAME', 'SUBJECT', 'MOBILE', 'SALARY'],
    table: 'teachers',
    map: (r) => ({ full_name: r.FULL_NAME, subject: r.SUBJECT, mobile: r.MOBILE, salary: r.SALARY })
  },
  fees: {
    sheet: 'Fees',
    columns: ['STUDENT_ID', 'AMOUNT', 'STATUS', 'PAYMENT_DATE'],
    table: 'fees',
    map: (r) => ({ student_id: r.STUDENT_ID, amount: r.AMOUNT, status: r.STATUS, payment_date: r.PAYMENT_DATE })
  },
  attendance: {
    sheet: 'Attendance',
    columns: ['STUDENT_ID', 'ATTENDANCE_DATE', 'STATUS'],
    table: 'attendance',
    map: (r) => ({ student_id: r.STUDENT_ID, attendance_date: r.ATTENDANCE_DATE, status: r.STATUS })
  },
  exams: {
    sheet: 'Exams',
    columns: ['EXAM_NAME', 'CLASS_NAME'],
    table: 'exams',
    map: (r) => ({ exam_name: r.EXAM_NAME, class_name: r.CLASS_NAME })
  },
  marks: {
    sheet: 'Marks',
    columns: ['STUDENT_ID', 'EXAM_ID', 'SUBJECT', 'MARKS'],
    table: 'marks',
    map: (r) => ({ student_id: r.STUDENT_ID, exam_id: r.EXAM_ID, subject: r.SUBJECT, marks: r.MARKS })
  }
};

async function downloadTemplate(req, res) {
  const entity = req.params.entity;
  const tpl = templates[entity];
  if (!tpl) return res.status(400).json({ success: false, message: 'Invalid entity' });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([tpl.columns]);
  XLSX.utils.book_append_sheet(wb, ws, tpl.sheet);

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${entity}_template.xlsx"`);
  res.send(buf);
}

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

  async function importExcel(req, res) {
  const entity = req.params.entity;
  const tpl = templates[entity];
  if (!tpl) return res.status(400).json({ success: false, message: 'Invalid entity' });
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const schoolId = getSchoolId(req);

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (rows.length === 0) return res.json({ success: true, message: 'No data found in file', imported: 0, errors: 0 });

    let imported = 0, errors = 0, errorDetails = [];

    for (let i = 0; i < rows.length; i++) {
      const data = tpl.map(rows[i]);
      if (schoolId) data.school_id = schoolId;
      // Skip empty rows
      if (Object.values(data).every(v => !v || v === '')) continue;

      const { error } = await supabase.from(tpl.table).insert([data]);
      if (error) {
        errors++;
        errorDetails.push(`Row ${i + 2}: ${error.message}`);
      } else {
        imported++;
      }
    }

    res.json({
      success: true,
      message: `Imported ${imported} rows, ${errors} errors`,
      imported,
      errors,
      errorDetails
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to parse Excel file: ' + err.message });
  }
}

module.exports = { downloadTemplate, importExcel, upload };
