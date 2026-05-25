const supabase = require('../supabaseClient');

async function getAllSchools(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { data, error } = await supabase.from('school_info').select('*').order('school_name');

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json(data || []);
}

async function getSchool(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const { data, error } = await supabase.from('school_info').select('*').eq('id', id).single();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json(data || {});
}

async function upsertSchoolInfo(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const body = { ...req.body, updated_at: new Date().toISOString() };
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });

  const { id, ...data } = body;

  let result;
  if (id) {
    result = await supabase.from('school_info').update(data).eq('id', id).select();
  } else {
    result = await supabase.from('school_info').insert([data]).select();
  }

  const { data: resultData, error } = result;

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: id ? 'School updated' : 'School added', data: resultData?.[0] || resultData });
}

async function deleteSchool(req, res) {
  if (!supabase) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  }

  const { id } = req.params;
  const { error } = await supabase.from('school_info').delete().eq('id', id);

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: 'School deleted' });
}

module.exports = { getAllSchools, getSchool, upsertSchoolInfo, deleteSchool };
