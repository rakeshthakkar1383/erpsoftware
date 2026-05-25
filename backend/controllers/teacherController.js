const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

async function addTeacher(req, res) {
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
  const { error } = await supabase.from('teachers').insert([data]);

  if (error) {
    return res.status(400).json(error);
  }

  res.json({ success: true, message: 'Teacher Added' });
}

async function getAllTeachers(req, res) {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY.'
    });
  }

  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('teachers').select('*'), schoolId);

  if (error) {
    return res.status(400).json(error);
  }

  res.json(data);
}

async function updateTeacher(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  const { id: _, created_at, ...body } = req.body;
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });
  let query = supabase.from('teachers').update(body).eq('id', id).select();
  if (schoolId) query = query.eq('school_id', schoolId);
  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Teacher Updated', data });
}

async function deleteTeacher(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('teachers').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'Teacher Deleted' });
}

module.exports = {
  addTeacher,
  getAllTeachers,
  updateTeacher,
  deleteTeacher
};
