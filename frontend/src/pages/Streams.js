import { useState, useEffect } from 'react';
import axios from 'axios';

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));
const emptyForm = { class_name: '', stream_name: '' };

function Streams() {
  const [streams, setStreams] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchStreams = async () => {
    try {
      const res = await axios.get('/api/streams');
      setStreams(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStreams(); }, []);

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm }); setMessage(''); setModal(true);
  };

  const openEdit = (d) => {
    setEditing(d); setForm({ class_name: d.class_name, stream_name: d.stream_name }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.class_name || !form.stream_name) { setMessage('Class and Stream are required'); return; }
    try {
      if (editing) {
        await axios.put(`/api/streams/${editing.id}`, form);
      } else {
        await axios.post('/api/streams/add', form);
      }
      setModal(false); fetchStreams();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stream?')) return;
    try { await axios.delete(`/api/streams/${id}`); fetchStreams(); }
    catch (err) { alert('Delete failed'); }
  };

  const grouped = {};
  streams.forEach(d => {
    if (!grouped[d.class_name]) grouped[d.class_name] = [];
    grouped[d.class_name].push(d);
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Streams</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add Stream</button>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      {streams.length === 0 ? <p>No streams found.</p> : (
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
                      <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Stream</th><th className="px-3 py-2">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {items.map((d, i) => (
                        <tr key={d.id}>
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2">{d.stream_name}</td>
                          <td className="flex gap-2 px-3 py-2">
                            <button className="text-blue-600 hover:underline" onClick={() => openEdit(d)}>Edit</button>
                            <button className="text-red-600 hover:underline" onClick={() => handleDelete(d.id)}>Delete</button>
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
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Stream' : 'Add Stream'}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.class_name} onChange={set('class_name')}>
                <option value="">Select Class *</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <input className="w-full rounded border p-3 text-sm" placeholder="Stream (e.g. General, Commerce, Arts, Science) *" value={form.stream_name} onChange={set('stream_name')} />
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

export default Streams;
