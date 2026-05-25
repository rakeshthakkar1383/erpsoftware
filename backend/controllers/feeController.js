const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');
const PDFDocument = require('pdfkit');

async function addFee(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const data = req.body;
  Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });

  const schoolId = getSchoolId(req);
  if (schoolId) data.school_id = schoolId;

  if (data.particulars && Array.isArray(data.particulars)) {
    data.amount = data.particulars.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    data.particulars = JSON.stringify(data.particulars);
  }

  const { error } = await supabase.from('fees').insert([data]);

  if (error) {
    return res.status(400).json(error);
  }

  res.json({ success: true, message: 'Fee record added' });
}

async function getAllFees(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('fees').select('*'), schoolId);

  if (error) {
    return res.status(400).json(error);
  }

  const parsed = (data || []).map(f => ({
    ...f,
    particulars: typeof f.particulars === 'string' ? JSON.parse(f.particulars) : (f.particulars || [])
  }));

  res.json(parsed);
}

async function getFeesByStudent(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const student_id = req.params.student_id;
  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('fees').select('*').eq('student_id', student_id), schoolId);

  if (error) {
    return res.status(400).json(error);
  }

  const parsed = (data || []).map(f => ({
    ...f,
    particulars: typeof f.particulars === 'string' ? JSON.parse(f.particulars) : (f.particulars || [])
  }));

  res.json(parsed);
}

async function updateFee(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  const { id: _, created_at, ...body } = req.body;
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });

  if (body.particulars && Array.isArray(body.particulars)) {
    body.amount = body.particulars.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    body.particulars = JSON.stringify(body.particulars);
  }

  let query = supabase.from('fees').update(body).eq('id', id).select();
  if (schoolId) query = query.eq('school_id', schoolId);
  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Fee record Updated', data });
}

async function deleteFee(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('fees').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Fee record Deleted' });
}

async function getFeeReceipt(req, res) {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
    }

    const { id } = req.params;

    const schoolId = getSchoolId(req);
    let feeQuery = supabase.from('fees').select('*').eq('id', id).single();
    if (schoolId) feeQuery = feeQuery.eq('school_id', schoolId);
    const { data: fee, error: feeError } = await feeQuery;
    if (feeError || !fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    let studentQuery = supabase.from('students').select('*').eq('id', fee.student_id).single();
    if (schoolId) studentQuery = studentQuery.eq('school_id', schoolId);
    const { data: student, error: studentError } = await studentQuery;
    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { data: school } = await supabase.from('school_info').select('*').limit(1).maybeSingle();

    let particulars = fee.particulars;
    if (typeof particulars === 'string') {
      try { particulars = JSON.parse(particulars); } catch (e) { particulars = []; }
    }
    if (!Array.isArray(particulars)) particulars = [];

    const schoolName = school?.school_name || 'School ERP';
    const schoolAddress = school?.address || '';
    const schoolPhone = school?.phone || '';
    const schoolEmail = school?.email || '';

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    const isDownload = req.query.download === '1';
    res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="receipt_${id}.pdf"`);
    doc.pipe(res);

    const pageWidth = 495;
    const leftMargin = 50;

    doc.fontSize(22).font('Helvetica-Bold').text(schoolName, { align: 'center' });
    if (schoolAddress) doc.fontSize(10).font('Helvetica').text(schoolAddress, { align: 'center' });
    if (schoolPhone || schoolEmail) {
      const contact = [schoolPhone, schoolEmail].filter(Boolean).join('  |  ');
      doc.fontSize(9).font('Helvetica').text(contact, { align: 'center' });
    }
    doc.moveDown(0.5);

    doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(16).font('Helvetica-Bold').text('FEE RECEIPT', { align: 'center' });
    doc.moveDown(0.3);

    doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y).stroke();
    doc.moveDown(0.8);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Receipt #: ${fee.id}`, leftMargin, doc.y, { continued: false });
    doc.text(`Date: ${fee.payment_date ? new Date(fee.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, { align: 'right' });
    doc.moveDown(0.8);

    const detailBoxY = doc.y;
    doc.roundedRect(leftMargin, detailBoxY, pageWidth, 65, 4).stroke('#333');
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('STUDENT DETAILS', leftMargin + 8, detailBoxY + 6);
    doc.font('Helvetica');
    doc.text(`Name   : ${student.full_name || 'N/A'}`, leftMargin + 8, detailBoxY + 22);
    doc.text(`Class  : ${student.class_name || 'N/A'}${student.division ? ` - ${student.division}` : ''}`, leftMargin + 8, detailBoxY + 36);
    doc.text(`Father : ${student.father_name || 'N/A'}`, leftMargin + 200, detailBoxY + 22);
    doc.text(`Mother : ${student.mother_name || 'N/A'}`, leftMargin + 200, detailBoxY + 36);
    doc.y = detailBoxY + 75;

    doc.fontSize(9).font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.rect(leftMargin, tableTop, pageWidth, 18).fill('#2563eb');
    doc.fill('#ffffff');
    doc.text('#', leftMargin + 8, tableTop + 5);
    doc.text('Particulars', leftMargin + 40, tableTop + 5);
    doc.text('Amount', leftMargin + pageWidth - 80, tableTop + 5, { width: 70, align: 'right' });
    doc.fill('#000000');

    doc.font('Helvetica');
    let rowY = tableTop + 22;
    let srNo = 1;

    if (particulars.length > 0) {
      particulars.forEach((p, i) => {
        if (i % 2 === 0) {
          doc.rect(leftMargin, rowY - 4, pageWidth, 20).fill('#f8fafc');
        }
        doc.fill('#000000');
        doc.text(String(srNo), leftMargin + 8, rowY);
        doc.text(p.particular_name || p.name || 'Fee', leftMargin + 40, rowY);
        doc.text(`₹ ${Number(p.amount).toFixed(2)}`, leftMargin + pageWidth - 80, rowY, { width: 70, align: 'right' });
        rowY += 20;
        srNo++;
      });
    } else {
      doc.text('1', leftMargin + 8, rowY);
      doc.text('Tuition Fee', leftMargin + 40, rowY);
      doc.text(`₹ ${Number(fee.amount).toFixed(2)}`, leftMargin + pageWidth - 80, rowY, { width: 70, align: 'right' });
      rowY += 20;
    }

    doc.rect(leftMargin, rowY - 4, pageWidth, 22).fill('#e2e8f0');
    doc.fill('#000000');
    doc.font('Helvetica-Bold');
    doc.text('Total', leftMargin + 40, rowY + 1);
    doc.text(`₹ ${Number(fee.amount).toFixed(2)}`, leftMargin + pageWidth - 80, rowY + 1, { width: 70, align: 'right' });
    rowY += 26;

    doc.fill('#000000');
    doc.font('Helvetica');
    const statusY = rowY;
    doc.text(`Status : ${fee.status || 'N/A'}`, leftMargin, statusY);

    doc.fontSize(8).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, leftMargin, doc.y + 20);
    doc.text('This is a computer-generated receipt.', leftMargin, doc.y, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Receipt generation error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
  }
}

async function exportFees(req, res) {
  try {
    if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });

    const { class_name, division, academic_year_id, status } = req.query;

    const schoolId = getSchoolId(req);
    let query = filterBySchool(supabase.from('fees').select('*, students!inner(*)'), schoolId);

    if (class_name) query = query.eq('students.class_name', class_name);
    if (division) query = query.eq('students.division', division);
    if (academic_year_id) query = query.eq('students.academic_year_id', academic_year_id);
    if (status) query = query.eq('fees.status', status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(400).json(error);

    const rows = (data || []).map((f, i) => ({
      '#': i + 1,
      'Student Name': f.students?.full_name || '',
      'Class': f.students?.class_name || '',
      'Division': f.students?.division || '',
      'Amount': Number(f.amount).toFixed(2),
      'Status': f.status || '',
      'Payment Date': f.payment_date ? new Date(f.payment_date).toLocaleDateString('en-IN') : '',
      'Particulars': Array.isArray(f.particulars)
        ? f.particulars.map(p => `${p.particular_name}: ${p.amount}`).join(', ')
        : ''
    }));

    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 20) }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Fees Report');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="fees_report.xlsx"`);
    res.send(buf);
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ success: false, message: 'Export failed' });
  }
}

module.exports = {
  addFee,
  getAllFees,
  getFeesByStudent,
  updateFee,
  deleteFee,
  getFeeReceipt,
  exportFees
};
