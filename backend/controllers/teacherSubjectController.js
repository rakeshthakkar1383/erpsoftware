const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

async function getAll(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('teacher_subjects')
    .select('*, teachers(full_name)')
    .order('class_name').order('subject'), schoolId);
  if (error) return res.status(400).json(error);
  res.json(data || []);
}

async function add(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const data = req.body;
  Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });
  const schoolId = getSchoolId(req);
  if (schoolId) data.school_id = schoolId;
  const { error } = await supabase.from('teacher_subjects').insert([data]);
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Assignment Added' });
}

async function remove(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('teacher_subjects').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Assignment Removed' });
}

module.exports = { getAll, add, remove };
