import { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelActions from '../components/ExcelActions';

const emptyForm = { full_name: '', subject: '', mobile: '', salary: '' };

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('/api/teachers/all');
      setTeachers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setMessage('');
    setModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ ...t });
    setMessage('');
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name) {
      setMessage('Name is required');
      return;
    }
    try {
      if (editing) {
        await axios.put(`/api/teachers/${editing.id}`, form);
        setMessage('Teacher Updated');
      } else {
        await axios.post('/api/teachers/add', form);
        setMessage('Teacher Added');
      }
      setModal(false);
      fetchTeachers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try {
      await axios.delete(`/api/teachers/${id}`);
      fetchTeachers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const q = search.toLowerCase();
  const filtered = teachers.filter(t => {
    if (!q) return true;
    return [t.full_name, t.subject, t.mobile].some(v => v?.toLowerCase().includes(q));
  });

  if (loading) return <p>Loading teachers...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Teachers</h2>
        <div className="flex items-center gap-2">
          <ExcelActions entity="teachers" onImport={fetchTeachers} />
          <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add New</button>
        </div>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      <div className="mb-4">
        <input className="rounded border p-2 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="ml-2 text-sm text-slate-500">{filtered.length} teachers</span>
      </div>

      {filtered.length === 0 ? (
        <p>No teachers found.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Mobile</th>
                <th className="px-3 py-2">Salary</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((t, i) => (
                <tr key={t.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{t.full_name}</td>
                  <td className="px-3 py-2">{t.subject}</td>
                  <td className="px-3 py-2">{t.mobile}</td>
                  <td className="px-3 py-2">{t.salary}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(t)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Teacher' : 'Add Teacher'}</h3>
            <div className="grid gap-3">
              <input className="w-full rounded border p-3 text-sm" placeholder="Full Name *" value={form.full_name} onChange={set('full_name')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Subject" value={form.subject} onChange={set('subject')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Mobile" value={form.mobile} onChange={set('mobile')} />
              <input className="w-full rounded border p-3 text-sm" type="number" placeholder="Salary" value={form.salary} onChange={set('salary')} />
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

export default Teachers;
