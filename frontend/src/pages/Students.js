import { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelActions from '../components/ExcelActions';

const emptyForm = {
  full_name: '', gender: '', father_name: '', mother_name: '',
  dob: '', birthplace: '', address: '', village: '', district: '',
  city: '', last_school: '', roll_no: '', division: '', class_name: '', stream: '',
  academic_year_id: '', school_id: '',
  photo_url: '', birth_cert_url: '', aadhar_url: '', father_aadhar_url: ''
};

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

function Students({ user, teacherClass, schoolName }) {
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [streams, setStreams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterClass, setFilterClass] = useState('');
  const [filterDiv, setFilterDiv] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterAy, setFilterAy] = useState('');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');

  const [detailStudent, setDetailStudent] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchData = async () => {
    try {
      const sRes = await axios.get('/api/students/all');
      setStudents(sRes.data || []);
    } catch (err) { console.error('students fetch error:', err); }
    try {
      const ayRes = await axios.get('/api/academic-years');
      setAcademicYears(ayRes.data || []);
    } catch (err) { console.error('academic-years fetch error:', err); }
    try {
      const dRes = await axios.get('/api/divisions');
      setDivisions(dRes.data || []);
    } catch (err) { console.error('divisions fetch error:', err); }
    try {
      const stRes = await axios.get('/api/streams');
      setStreams(stRes.data || []);
    } catch (err) { console.error('streams fetch error:', err); }
    try {
      const scRes = await axios.get('/api/school-info');
      setSchools(scRes.data || []);
    } catch (err) { console.error('schools fetch error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { if (teacherClass) setFilterClass(teacherClass); }, [teacherClass]);

  const ayMap = {};
  academicYears.forEach(y => { ayMap[y.id] = y; });

  const divOptions = divisions.filter(d => d.class_name === (filterClass || form.class_name));
  const streamOptions = streams.filter(s => s.class_name === (filterClass || form.class_name));

  const q = search.toLowerCase();
  const filtered = students.filter(s => {
    if (filterClass && s.class_name !== filterClass) return false;
    if (filterDiv && s.division !== filterDiv) return false;
    if (filterStream && s.stream !== filterStream) return false;
    if (filterAy && String(s.academic_year_id) !== filterAy) return false;
    if (q && ![s.full_name, s.gender, s.father_name, s.mother_name, s.class_name, s.division, s.stream, s.address, s.village, s.district, s.city, s.last_school, String(s.roll_no || '')].some(v => v?.toLowerCase().includes(q))) return false;
    return true;
  });

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm, school_id: user?.school_id || '' }); setMessage(''); setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s); setForm({ ...s, academic_year_id: s.academic_year_id || '', school_id: s.school_id || '' }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.class_name) { setMessage('Name and Class are required'); return; }
    try {
      if (editing) {
        await axios.put(`/api/students/${editing.id}`, form);
      } else {
        await axios.post('/api/students/add', form);
      }
      setModal(false); fetchData();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await axios.delete(`/api/students/${id}`); fetchData(); }
    catch (err) { alert('Delete failed'); }
  };

  const handleFileUpload = async (field, file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('/api/upload/single', fd);
      setForm({ ...form, [field]: res.data.url });
    } catch (err) { alert('Upload failed'); }
  };

  if (loading) return <p>Loading students...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Students</h2>
        <div className="flex items-center gap-2">
          <ExcelActions entity="students" onImport={fetchData} />
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add New</button>
        </div>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded border p-2 text-sm" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv(''); setFilterStream(''); }} disabled={!!teacherClass}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="rounded border p-2 text-sm" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.filter(d => d.class_name === filterClass || !filterClass).map(d => (
            <option key={d.id} value={d.division_name}>{d.division_name}</option>
          ))}
        </select>
        <select className="rounded border p-2 text-sm" value={filterStream} onChange={e => setFilterStream(e.target.value)}>
          <option value="">All Streams</option>
          {streams.filter(s => s.class_name === filterClass || !filterClass).map(s => (
            <option key={s.id} value={s.stream_name}>{s.stream_name}</option>
          ))}
        </select>
        <select className="rounded border p-2 text-sm" value={filterAy} onChange={e => setFilterAy(e.target.value)}>
          <option value="">All Years</option>
          {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
        </select>
        <span className="self-center text-sm text-slate-500">{filtered.length} students</span>
      </div>

      {filtered.length === 0 ? <p>No students found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Roll</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Gender</th>
                <th className="px-3 py-2">Father</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Division</th>
                <th className="px-3 py-2">Stream</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Last School</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((s, i) => (
                  <tr key={s.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{s.roll_no || '-'}</td>
                  <td className="px-3 py-2">{s.full_name}</td>
                  <td className="px-3 py-2">{s.gender}</td>
                  <td className="px-3 py-2">{s.father_name}</td>
                  <td className="px-3 py-2">{s.class_name}</td>
                  <td className="px-3 py-2">{s.division || '-'}</td>
                  <td className="px-3 py-2">{s.stream || '-'}</td>
                  <td className="px-3 py-2">{s.school_info?.school_name || schoolName || '-'}</td>
                  <td className="px-3 py-2">{ayMap[s.academic_year_id]?.year_name || '-'}</td>
                  <td className="px-3 py-2">{s.city || '-'}</td>
                  <td className="px-3 py-2">{s.last_school || '-'}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(s)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
                    <button className="text-green-600 hover:underline" onClick={() => setDetailStudent(s)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail View Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailStudent(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Student Details</h3>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setDetailStudent(null)}>&#10005;</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {detailStudent.full_name}</div>
              <div><span className="font-medium">Roll No:</span> {detailStudent.roll_no || '-'}</div>
              <div><span className="font-medium">Gender:</span> {detailStudent.gender}</div>
              <div><span className="font-medium">Father:</span> {detailStudent.father_name}</div>
              <div><span className="font-medium">Mother:</span> {detailStudent.mother_name}</div>
              <div><span className="font-medium">DOB:</span> {detailStudent.dob}</div>
              <div><span className="font-medium">Birth Place:</span> {detailStudent.birthplace}</div>
              <div><span className="font-medium">Address:</span> {detailStudent.address}</div>
              <div><span className="font-medium">Village:</span> {detailStudent.village}</div>
              <div><span className="font-medium">District:</span> {detailStudent.district}</div>
              <div><span className="font-medium">City:</span> {detailStudent.city || '-'}</div>
              <div><span className="font-medium">Last School:</span> {detailStudent.last_school || '-'}</div>
              <div><span className="font-medium">School:</span> {detailStudent.school_info?.school_name || schoolName || '-'}</div>
              <div><span className="font-medium">Class:</span> {detailStudent.class_name}</div>
              <div><span className="font-medium">Division:</span> {detailStudent.division || '-'}</div>
              <div><span className="font-medium">Stream:</span> {detailStudent.stream || '-'}</div>
              <div><span className="font-medium">Year:</span> {ayMap[detailStudent.academic_year_id]?.year_name || '-'}</div>
            </div>

            {/* Documents */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {detailStudent.photo_url && (
                <div>
                  <p className="mb-1 text-xs font-medium">Photo</p>
                  <a href={detailStudent.photo_url} target="_blank" rel="noopener noreferrer">
                    <img src={detailStudent.photo_url} alt="Photo" className="h-32 w-32 rounded border object-cover" />
                  </a>
                </div>
              )}
              {detailStudent.birth_cert_url && (
                <div>
                  <p className="mb-1 text-xs font-medium">Birth Certificate</p>
                  <a className="text-blue-600 hover:underline" href={detailStudent.birth_cert_url} target="_blank" rel="noopener noreferrer">View Document</a>
                </div>
              )}
              {detailStudent.aadhar_url && (
                <div>
                  <p className="mb-1 text-xs font-medium">Aadhar Card</p>
                  <a className="text-blue-600 hover:underline" href={detailStudent.aadhar_url} target="_blank" rel="noopener noreferrer">View Document</a>
                </div>
              )}
              {detailStudent.father_aadhar_url && (
                <div>
                  <p className="mb-1 text-xs font-medium">Father's Aadhar</p>
                  <a className="text-blue-600 hover:underline" href={detailStudent.father_aadhar_url} target="_blank" rel="noopener noreferrer">View Document</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Student' : 'Add Student'}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <select className="w-full rounded border p-3 text-sm" value={form.school_id} onChange={e => setForm({ ...form, school_id: e.target.value })}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.school_name}</option>)}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Student Name *" value={form.full_name} onChange={set('full_name')} />
              <select className="w-full rounded border p-3 text-sm" value={form.gender} onChange={set('gender')}>
                <option value="">Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Father's Name" value={form.father_name} onChange={set('father_name')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Mother's Name" value={form.mother_name} onChange={set('mother_name')} />
              <input className="w-full rounded border p-3 text-sm" type="date" placeholder="Birth Date" value={form.dob} onChange={set('dob')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Birth Place" value={form.birthplace} onChange={set('birthplace')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Address" value={form.address} onChange={set('address')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Village" value={form.village} onChange={set('village')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="District" value={form.district} onChange={set('district')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="City" value={form.city} onChange={set('city')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Last School" value={form.last_school} onChange={set('last_school')} />
              <input className="w-full rounded border p-3 text-sm" type="number" placeholder="Roll No" value={form.roll_no} onChange={e => setForm({ ...form, roll_no: e.target.value ? Number(e.target.value) : '' })} />
              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set('class_name')}>
                <option value="">Class *</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.division} onChange={set('division')}>
                <option value="">Division</option>
                {divisions.filter(d => d.class_name === form.class_name).map(d => (
                  <option key={d.id} value={d.division_name}>{d.division_name}</option>
                ))}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.stream} onChange={set('stream')}>
                <option value="">Stream</option>
                {streams.filter(s => s.class_name === form.class_name).map(s => (
                  <option key={s.id} value={s.stream_name}>{s.stream_name}</option>
                ))}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.academic_year_id} onChange={e => setForm({ ...form, academic_year_id: e.target.value })}>
                <option value="">Academic Year</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
              </select>
            </div>

            {/* File Uploads */}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Photo</label>
                <input className="w-full rounded border p-2 text-sm" type="file" accept="image/*" onChange={e => e.target.files[0] && handleFileUpload('photo_url', e.target.files[0])} />
                {form.photo_url && <span className="text-xs text-green-600">Uploaded</span>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Birth Certificate</label>
                <input className="w-full rounded border p-2 text-sm" type="file" accept="image/*,.pdf" onChange={e => e.target.files[0] && handleFileUpload('birth_cert_url', e.target.files[0])} />
                {form.birth_cert_url && <span className="text-xs text-green-600">Uploaded</span>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Aadhar Card</label>
                <input className="w-full rounded border p-2 text-sm" type="file" accept="image/*,.pdf" onChange={e => e.target.files[0] && handleFileUpload('aadhar_url', e.target.files[0])} />
                {form.aadhar_url && <span className="text-xs text-green-600">Uploaded</span>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Father's Aadhar</label>
                <input className="w-full rounded border p-2 text-sm" type="file" accept="image/*,.pdf" onChange={e => e.target.files[0] && handleFileUpload('father_aadhar_url', e.target.files[0])} />
                {form.father_aadhar_url && <span className="text-xs text-green-600">Uploaded</span>}
              </div>
            </div>

            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>{editing ? 'Update' : 'Save'}</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
