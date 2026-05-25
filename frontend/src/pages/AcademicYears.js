import { useState, useEffect } from 'react';
import axios from 'axios';

const emptyForm = { year_name: '', start_date: '', end_date: '' };

function AcademicYears() {
  const [years, setYears] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');
  const [promoteFrom, setPromoteFrom] = useState('');
  const [promoteTo, setPromoteTo] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const fetchYears = async () => {
    try {
      const res = await axios.get('/api/academic-years');
      setYears(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchYears(); }, []);

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm }); setMessage(''); setModal(true);
  };

  const openEdit = (y) => {
    setEditing(y); setForm({ year_name: y.year_name, start_date: y.start_date || '', end_date: y.end_date || '' }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.year_name) { setMessage('Year name is required'); return; }
    try {
      if (editing) {
        await axios.put(`/api/academic-years/${editing.id}`, form);
      } else {
        await axios.post('/api/academic-years/add', form);
      }
      setModal(false); fetchYears();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this academic year?')) return;
    try { await axios.delete(`/api/academic-years/${id}`); fetchYears(); }
    catch (err) { alert('Delete failed'); }
  };

  const handleActivate = async (id) => {
    try { await axios.put(`/api/academic-years/${id}/activate`); fetchYears(); }
    catch (err) { alert('Activate failed'); }
  };

  const handlePromote = async () => {
    if (!promoteFrom || !promoteTo) { setMessage('Select both source and target year'); return; }
    if (!window.confirm('Promote all students to next class in the target academic year?')) return;
    try {
      const res = await axios.post('/api/academic-years/promote', { from_year_id: promoteFrom, to_year_id: promoteTo });
      setMessage(res.data.message);
    } catch (err) { setMessage(err.response?.data?.message || 'Promotion failed'); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Academic Years</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add Year</button>
      </div>

      {message && <p className="mb-3 text-sm text-slate-700">{message}</p>}

      {/* Promote Section */}
      {years.length > 1 && (
        <div className="mb-6 rounded border bg-yellow-50 p-4">
          <h3 className="mb-3 font-medium">Promote Students to Next Academic Year</h3>
          <div className="flex gap-3">
            <select className="w-full rounded border p-3 text-sm" value={promoteFrom} onChange={(e) => setPromoteFrom(e.target.value)}>
              <option value="">From Year</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
            </select>
            <select className="w-full rounded border p-3 text-sm" value={promoteTo} onChange={(e) => setPromoteTo(e.target.value)}>
              <option value="">To Year</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
            </select>
            <button className="rounded bg-green-600 px-5 py-2 text-white hover:bg-green-700" onClick={handlePromote}>Promote</button>
          </div>
        </div>
      )}

      {years.length === 0 ? <p>No academic years found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {years.map((y, i) => (
                <tr key={y.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{y.year_name}</td>
                  <td className="px-3 py-2">{y.start_date || '-'}</td>
                  <td className="px-3 py-2">{y.end_date || '-'}</td>
                  <td className="px-3 py-2">
                    {y.is_active ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Active</span> : 'Inactive'}
                  </td>
                  <td className="flex gap-2 px-3 py-2">
                    {!y.is_active && <button className="text-green-600 hover:underline" onClick={() => handleActivate(y.id)}>Activate</button>}
                    <button className="text-blue-600 hover:underline" onClick={() => openEdit(y)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(y.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Academic Year' : 'Add Academic Year'}</h3>
            <div className="grid gap-3">
              <input className="w-full rounded border p-3 text-sm" placeholder="Year Name (e.g. 2025-26) *" value={form.year_name} onChange={set('year_name')} />
              <input className="w-full rounded border p-3 text-sm" type="date" placeholder="Start Date" value={form.start_date} onChange={set('start_date')} />
              <input className="w-full rounded border p-3 text-sm" type="date" placeholder="End Date" value={form.end_date} onChange={set('end_date')} />
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

export default AcademicYears;
