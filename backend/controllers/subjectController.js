const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

async function addSubject(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const data = req.body;
  Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });
  const schoolId = getSchoolId(req);
  if (schoolId) data.school_id = schoolId;
  const { error } = await supabase.from('subjects').insert([data]);
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Subject Added' });
}

async function getAllSubjects(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('subjects').select('*'), schoolId).order('class_name').order('subject_name');
  if (error) return res.status(400).json(error);
  res.json(data);
}

async function updateSubject(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  const { id: _, created_at, ...body } = req.body;
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });
  let query = supabase.from('subjects').update(body).eq('id', id).select();
  if (schoolId) query = query.eq('school_id', schoolId);
  const { data, error } = await query;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Subject Updated', data });
}

async function deleteSubject(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('subjects').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Subject Deleted' });
}

module.exports = { addSubject, getAllSubjects, updateSubject, deleteSubject };
