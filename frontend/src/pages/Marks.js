import { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelActions from '../components/ExcelActions';

const emptyForm = { student_id: '', exam_id: '', subject: '', marks: '' };

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

function Marks({ user, teacherClass }) {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
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
  const examMap = {};
  exams.forEach(e => { examMap[e.id] = e; });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchData = async () => {
    try { const r = await axios.get('/api/marks/all'); setMarks(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/students/all'); setStudents(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/exams/all'); setExams(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/divisions'); setDivisions(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/teacher-subjects'); setTeacherSubjects(r.data || []); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (teacherClass) setFilterClass(teacherClass); }, [teacherClass]);

  const getTeacherForSubject = (className, subject) => {
    const match = teacherSubjects.find(ts => ts.class_name === className && ts.subject === subject);
    return match?.teachers?.full_name || null;
  };

  const filteredStudents = students.filter(s => {
    if (filterClass && s.class_name !== filterClass) return false;
    if (filterDiv && s.division !== filterDiv) return false;
    return true;
  });
  const filteredStudentIds = new Set(filteredStudents.map(s => s.id));
  const q = search.toLowerCase();
  const filtered = marks.filter(m => {
    if (!filteredStudentIds.has(m.student_id)) return false;
    if (!q) return true;
    const s = studentMap[m.student_id];
    const e = examMap[m.exam_id];
    return [m.subject, String(m.marks), s?.full_name, e?.exam_name].some(v => v?.toLowerCase().includes(q));
  });

  const selectedStudent = studentMap[form.student_id];
  const assignedTeacher = selectedStudent ? getTeacherForSubject(selectedStudent.class_name, form.subject) : null;

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm }); setMessage(''); setModal(true);
  };

  const openEdit = (m) => {
    setEditing(m); setForm({ ...m }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.student_id || !form.exam_id || !form.subject || !form.marks) { setMessage('All fields are required'); return; }
    try {
      if (editing) { await axios.put(`/api/marks/${editing.id}`, form); }
      else { await axios.post('/api/marks/add', form); }
      setModal(false); fetchData();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mark record?')) return;
    try { await axios.delete(`/api/marks/${id}`); fetchData(); }
    catch (err) { alert('Delete failed'); }
  };

  if (loading) return <p>Loading marks...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Marks</h2>
        <div className="flex items-center gap-2">
          <ExcelActions entity="marks" onImport={fetchData} />
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

      {filtered.length === 0 ? <p>No marks found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Exam</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Teacher</th>
                <th className="px-3 py-2">Marks</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((m, i) => {
                const s = studentMap[m.student_id];
                const e = examMap[m.exam_id];
                const teacher = s ? getTeacherForSubject(s.class_name, m.subject) : null;
                return (
                  <tr key={m.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s ? `${s.full_name} (${s.class_name})` : m.student_id}</td>
                    <td className="px-3 py-2">{e ? e.exam_name : m.exam_id}</td>
                    <td className="px-3 py-2">{m.subject}</td>
                    <td className="px-3 py-2">{teacher || '-'}</td>
                    <td className="px-3 py-2">{m.marks}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={() => openEdit(m)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(m.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Marks' : 'Add Marks'}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.student_id} onChange={set('student_id')}>
                <option value="">Select Student *</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>
                ))}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.exam_id} onChange={set('exam_id')}>
                <option value="">Select Exam *</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.exam_name} - Class {e.class_name}</option>
                ))}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Subject *" value={form.subject} onChange={set('subject')} />
              {assignedTeacher && (
                <p className="text-xs text-green-700">Teacher: {assignedTeacher}</p>
              )}
              <input className="w-full rounded border p-3 text-sm" type="number" placeholder="Marks *" value={form.marks} onChange={set('marks')} />
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

export default Marks;
