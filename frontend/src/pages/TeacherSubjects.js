import { useState, useEffect } from 'react';
import axios from 'axios';

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));
const emptyForm = { teacher_id: '', class_name: '', subject: '' };

function TeacherSubjects() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: field === 'teacher_id' ? e.target.value : e.target.value.toUpperCase() });

  const fetchData = async () => {
    try { const r = await axios.get('/api/teacher-subjects'); setAssignments(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/teachers/all'); setTeachers(r.data || []); } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const teacherMap = {};
  teachers.forEach(t => { teacherMap[t.id] = t; });

  const openAdd = () => {
    setForm({ ...emptyForm }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.teacher_id || !form.class_name || !form.subject) { setMessage('All fields are required'); return; }
    try {
      await axios.post('/api/teacher-subjects/add', form);
      setModal(false); fetchData();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try { await axios.delete(`/api/teacher-subjects/${id}`); fetchData(); }
    catch (err) { alert('Delete failed'); }
  };

  const grouped = {};
  assignments.forEach(a => {
    if (!grouped[a.class_name]) grouped[a.class_name] = [];
    grouped[a.class_name].push(a);
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Teacher Assignments</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add Assignment</button>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      {assignments.length === 0 ? <p>No teacher assignments found.</p> : (
        <div className="space-y-6">
          {classes.map(cls => {
            const items = grouped[cls] || [];
            if (items.length === 0) return null;
            return (
              <div key={cls}>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">Class {cls}</h3>
                <div className="overflow-x-auto rounded border">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 uppercase text-slate-600">
                      <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Teacher</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {items.map((a, i) => (
                        <tr key={a.id}>
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2">{a.teachers?.full_name || 'Unknown'}</td>
                          <td className="px-3 py-2">{a.subject}</td>
                          <td className="px-3 py-2">
                            <button className="text-red-600 hover:underline" onClick={() => handleDelete(a.id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">Add Teacher Assignment</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.teacher_id} onChange={set('teacher_id')}>
                <option value="">Select Teacher *</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name} {t.subject ? `(${t.subject})` : ''}</option>
                ))}
              </select>
              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set('class_name')}>
                <option value="">Select Class *</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Subject *" value={form.subject} onChange={set('subject')} />
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>Save</button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherSubjects;
