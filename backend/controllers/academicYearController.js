const supabase = require('../supabaseClient');
const { filterBySchool, getSchoolId } = require('../schoolQuery');

async function getAll(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const schoolId = getSchoolId(req);
  const { data, error } = await filterBySchool(supabase.from('academic_years').select('*'), schoolId).order('year_name', { ascending: false });
  if (error) return res.status(400).json(error);
  res.json(data);
}

async function add(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const data = req.body;
  Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });
  const schoolId = getSchoolId(req);
  if (schoolId) data.school_id = schoolId;
  const { error } = await supabase.from('academic_years').insert([data]);
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Academic Year Added' });
}

async function update(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  const { id: _, created_at, ...body } = req.body;
  Object.keys(body).forEach(k => { if (body[k] === '') body[k] = null; });
  let query = supabase.from('academic_years').update(body).eq('id', id).select();
  if (schoolId) query = query.eq('school_id', schoolId);
  const { data, error } = await query;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Academic Year Updated', data });
}

async function remove(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let query = supabase.from('academic_years').delete().eq('id', id);
  if (schoolId) query = query.eq('school_id', schoolId);
  const { error } = await query;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Academic Year Deleted' });
}

async function setActive(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });
  const { id } = req.params;
  const schoolId = getSchoolId(req);
  let deactivateQuery = supabase.from('academic_years').update({ is_active: false }).neq('id', id);
  if (schoolId) deactivateQuery = deactivateQuery.eq('school_id', schoolId);
  await deactivateQuery;
  let activateQuery = supabase.from('academic_years').update({ is_active: true }).eq('id', id);
  if (schoolId) activateQuery = activateQuery.eq('school_id', schoolId);
  const { error } = await activateQuery;
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Academic Year Set Active' });
}

async function promoteStudents(req, res) {
  if (!supabase) return res.status(503).json({ success: false, message: 'Supabase is not configured.' });

  const { from_year_id, to_year_id } = req.body;
  if (!from_year_id || !to_year_id) {
    return res.status(400).json({ success: false, message: 'from_year_id and to_year_id are required' });
  }

  const schoolId = getSchoolId(req);
  const { data: students, error: fetchError } = await filterBySchool(
    supabase
      .from('students')
      .select('*')
      .eq('academic_year_id', from_year_id),
    schoolId
  );

  if (fetchError) return res.status(400).json({ success: false, message: fetchError.message });
  if (!students || students.length === 0) {
    return res.json({ success: true, message: 'No students to promote', count: 0 });
  }

  const classes = ['1','2','3','4','5','6','7','8','9','10','11','12'];
  const nextClass = {};
  classes.forEach((c, i) => { if (i < classes.length - 1) nextClass[c] = classes[i + 1]; });

  let promoted = 0;
  for (const s of students) {
    const newClass = nextClass[s.class_name];
    if (!newClass) continue;
    const { error: insertError } = await supabase.from('students').insert([{
      full_name: s.full_name,
      gender: s.gender,
      father_name: s.father_name,
      mother_name: s.mother_name,
      dob: s.dob,
      birthplace: s.birthplace,
      mobile: s.mobile,
      address: s.address,
      village: s.village,
      district: s.district,
      division: s.division,
      class_name: newClass,
      academic_year_id: to_year_id,
      school_id: schoolId
    }]);
    if (!insertError) promoted++;
  }

  res.json({ success: true, message: `${promoted} students promoted`, count: promoted });
}

module.exports = { getAll, add, update, remove, setActive, promoteStudents };
