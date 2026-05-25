import { useState, useEffect } from 'react';
import axios from 'axios';

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

const emptyForm = { class_name: '', subject_name: '' };

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/api/subjects/all');
      setSubjects(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setMessage('');
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ class_name: s.class_name, subject_name: s.subject_name });
    setMessage('');
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.class_name || !form.subject_name) {
      setMessage('Class and Subject are required');
      return;
    }
    try {
      if (editing) {
        await axios.put(`/api/subjects/${editing.id}`, form);
        setMessage('Subject Updated');
      } else {
        await axios.post('/api/subjects/add', form);
        setMessage('Subject Added');
      }
      setModal(false);
      fetchSubjects();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await axios.delete(`/api/subjects/${id}`);
      fetchSubjects();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const grouped = {};
  subjects.forEach((s) => {
    if (!grouped[s.class_name]) grouped[s.class_name] = [];
    grouped[s.class_name].push(s);
  });

  if (loading) return <p>Loading subjects...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Class & Subject Management</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>
          Add Subject
        </button>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      {subjects.length === 0 ? (
        <p>No subjects found. Add subjects for each class.</p>
      ) : (
        <div className="space-y-6">
          {classes.map((cls) => {
            const items = grouped[cls] || [];
            if (items.length === 0) return null;
            return (
              <div key={cls}>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">Class {cls}</h3>
                <div className="overflow-x-auto rounded border">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Subject</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {items.map((s, i) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2">{s.subject_name}</td>
                          <td className="flex gap-2 px-3 py-2">
                            <button className="text-blue-600 hover:underline" onClick={() => openEdit(s)}>Edit</button>
                            <button className="text-red-600 hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Subject' : 'Add Subject'}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set('class_name')}>
                <option value="">Select Class *</option>
                {classes.map((c) => (<option key={c} value={c}>Class {c}</option>))}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Subject Name *" value={form.subject_name} onChange={set('subject_name')} />
            </div>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className="mt-4 flex gap-3">
              <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700" onClick={handleSave}>
                {editing ? 'Update' : 'Save'}
              </button>
              <button className="rounded bg-slate-300 px-5 py-2 text-slate-700 hover:bg-slate-400" onClick={() => setModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
