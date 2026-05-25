const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

async function getAll(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('fee_particulars').select('*'), schoolId).order('class_name').order('particular_name');
  if (error) return res.status(400).json(error);
  res.json(data);
}

async function add(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const data = req.body;
  Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });
  const schoolId = getSchoolId(req);
  if (schoolId) data.school_id = schoolId;
  const { error } = await supabase.from('fee_particulars').insert([data]);
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Fee Particular Added' });
}

async function update(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  const { id: _, created_at, ...body } = req.body;
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });
  let query = supabase.from('fee_particulars').update(body).eq('id', id).select();
  if (schoolId) query = query.eq('school_id', schoolId);
  const { data, error } = await query;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Fee Particular Updated', data });
}

async function remove(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('fee_particulars').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Fee Particular Deleted' });
}

module.exports = { getAll, add, update, remove };
