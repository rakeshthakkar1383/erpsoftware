const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

async function addStudent(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const data = req.body;
  Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });
  console.log('addStudent: received', data);

  const schoolId = getSchoolId(req);
  if (schoolId) data.school_id = schoolId;

  try {
    // Auto-assign roll_no: max roll_no for same class+division + 1
    if (!data.roll_no && data.class_name) {
      const div = data.division || '';
      const { data: existing } = await filterBySchool(
        supabase
          .from('students')
          .select('roll_no')
          .eq('class_name', data.class_name)
          .eq('division', div)
          .order('roll_no', { ascending: false })
          .limit(1),
        schoolId
      );
      const maxRoll = existing && existing.length > 0 ? (existing[0].roll_no || 0) : 0;
      data.roll_no = maxRoll + 1;
    }

    const insertPromise = supabase.from('students').insert([data]);
    const resOrErr = await Promise.race([
      insertPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase request timeout')), 5000))
    ]);

    const { error } = resOrErr;
    console.log('addStudent: insert completed, error=', error);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to insert student',
        details: error
      });
    }
  } catch (err) {
    console.error('addStudent: error during insert', err);
    return res.status(504).json({ success: false, message: err.message || 'Supabase insert failed' });
  }

  res.json({
    success: true,
    message: 'Student Added'
  });
}

async function getAllStudents(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('students').select('*'), schoolId);

  if (error) {
    return res.status(400).json(error);
  }

  res.json(data);
}

async function updateStudent(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  const { id: _, created_at, ...body } = req.body;
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });
  let query = supabase.from('students').update(body).eq('id', id).select();
  if (schoolId) query = query.eq('school_id', schoolId);
  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Student Updated', data });
}

async function deleteStudent(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('students').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Student Deleted' });
}

module.exports = {
  addStudent,
  getAllStudents,
  updateStudent,
  deleteStudent
};
