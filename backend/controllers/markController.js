const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

async function addMark(req, res) {
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
  const { error } = await supabase.from('marks').insert([data]);

  if (error) {
    return res.status(400).json(error);
  }

  res.json({ success: true, message: 'Mark record added' });
}

async function getAllMarks(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('marks').select('*'), schoolId);

  if (error) {
    return res.status(400).json(error);
  }

  res.json(data);
}

async function getMarksByStudent(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const student_id = req.params.student_id;
  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('marks').select('*').eq('student_id', student_id), schoolId);

  if (error) {
    return res.status(400).json(error);
  }

  res.json(data);
}

async function updateMark(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  const { id: _, created_at, ...body } = req.body;
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });
  let query = supabase.from('marks').update(body).eq('id', id).select();
  if (schoolId) query = query.eq('school_id', schoolId);
  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Mark record Updated', data });
}

async function deleteMark(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('marks').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Mark record Deleted' });
}

module.exports = {
  addMark,
  getAllMarks,
  getMarksByStudent,
  updateMark,
  deleteMark
};
