import { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelActions from '../components/ExcelActions';

const emptyForm = { student_id: '', attendance_date: '', status: '' };

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

function Attendance({ user, teacherClass }) {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterClass, setFilterClass] = useState('');
  const [filterDiv, setFilterDiv] = useState('');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchData = async () => {
    try { const r = await axios.get('/api/attendance/all'); setRecords(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/students/all'); setStudents(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/divisions'); setDivisions(r.data || []); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (teacherClass) setFilterClass(teacherClass); }, [teacherClass]);

  const filteredStudents = students.filter(s => {
    if (filterClass && s.class_name !== filterClass) return false;
    if (filterDiv && s.division !== filterDiv) return false;
    return true;
  });
  const filteredStudentIds = new Set(filteredStudents.map(s => s.id));
  const q = search.toLowerCase();
  const filtered = records.filter(r => {
    if (!filteredStudentIds.has(r.student_id)) return false;
    if (!q) return true;
    const s = studentMap[r.student_id];
    return [r.attendance_date, r.status, s?.full_name, s?.class_name].some(v => v?.toLowerCase().includes(q));
  });

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm }); setMessage(''); setModal(true);
  };

  const openEdit = (r) => {
    setEditing(r); setForm({ ...r }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.student_id || !form.attendance_date || !form.status) { setMessage('All fields are required'); return; }
    try {
      if (editing) { await axios.put(`/api/attendance/${editing.id}`, form); }
      else { await axios.post('/api/attendance/add', form); }
      setModal(false); fetchData();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try { await axios.delete(`/api/attendance/${id}`); fetchData(); }
    catch (err) { alert('Delete failed'); }
  };

  if (loading) return <p>Loading attendance...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Attendance</h2>
        <div className="flex items-center gap-2">
          <ExcelActions entity="attendance" onImport={fetchData} />
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add New</button>
        </div>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="rounded border p-2 text-sm" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterDiv(''); }} disabled={!!teacherClass}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="rounded border p-2 text-sm" value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.filter(d => d.class_name === filterClass || !filterClass).map(d => (
            <option key={d.id} value={d.division_name}>{d.division_name}</option>
          ))}
        </select>
        <span className="self-center text-sm text-slate-500">{filtered.length} records</span>
      </div>

      {filtered.length === 0 ? <p>No attendance records found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((r, i) => {
                const s = studentMap[r.student_id];
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s ? `${s.full_name} (${s.class_name})` : r.student_id}</td>
                    <td className="px-3 py-2">{r.attendance_date}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={() => openEdit(r)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(r.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Attendance' : 'Add Attendance'}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.student_id} onChange={set('student_id')}>
                <option value="">Select Student *</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>
                ))}
              </select>
              <input className="w-full rounded border p-3 text-sm" type="date" placeholder="Date *" value={form.attendance_date} onChange={set('attendance_date')} />
              <select className="w-full rounded border p-3 text-sm" value={form.status} onChange={set('status')}>
                <option value="">Status *</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
              </select>
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

export default Attendance;
