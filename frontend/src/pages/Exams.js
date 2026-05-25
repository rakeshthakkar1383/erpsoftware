import { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelActions from '../components/ExcelActions';

const emptyForm = { exam_name: '', class_name: '' };

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

function Exams({ user, teacherClass }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchExams = async () => {
    try {
      const res = await axios.get('/api/exams/all');
      setExams(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setMessage('');
    setModal(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ ...e });
    setMessage('');
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.exam_name || !form.class_name) {
      setMessage('Exam Name and Class are required');
      return;
    }
    try {
      if (editing) {
        await axios.put(`/api/exams/${editing.id}`, form);
        setMessage('Exam Updated');
      } else {
        await axios.post('/api/exams/add', form);
        setMessage('Exam Added');
      }
      setModal(false);
      fetchExams();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await axios.delete(`/api/exams/${id}`);
      fetchExams();
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading) return <p>Loading exams...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Exams</h2>
        <div className="flex items-center gap-2">
          <ExcelActions entity="exams" onImport={fetchExams} />
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add New</button>
        </div>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">
          {exams.filter(e => !search || [e.exam_name, e.class_name].some(v => v?.toLowerCase().includes(search.toLowerCase()))).length} exams
        </span>
      </div>

      {(() => {
        const q = search.toLowerCase();
        const filtered = exams.filter(e => !q || [e.exam_name, e.class_name].some(v => v?.toLowerCase().includes(q)));
        return filtered.length === 0 ? <p>No exams found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Exam Name</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Created At</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((e, i) => (
                <tr key={e.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{e.exam_name}</td>
                  <td className="px-3 py-2">{e.class_name}</td>
                  <td className="px-3 py-2">{e.created_at || '-'}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(e)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        );
      })()}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Exam' : 'Add Exam'}</h3>
            <div className="grid gap-3">
              <input className="w-full rounded border p-3 text-sm" placeholder="Exam Name *" value={form.exam_name} onChange={set('exam_name')} />
              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set('class_name')}>
                <option value="">Class *</option>
                {classes.map((c) => (<option key={c} value={c}>Class {c}</option>))}
              </select>
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

export default Exams;
