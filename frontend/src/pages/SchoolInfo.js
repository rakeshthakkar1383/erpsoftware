import { useState, useEffect } from 'react';
import axios from 'axios';

const emptyForm = {
  school_name: '', address: '', phone: '', email: '',
  website: '', principal_name: '', affiliation: '', logo_url: ''
};

function SchoolInfo() {
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSchools = async () => {
    try {
      const res = await axios.get('/api/school-info');
      setSchools(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSchools(); }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm }); setMessage(''); setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s); setForm({ ...s }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.school_name) { setMessage('School Name is required'); return; }
    try {
      if (editing) {
        await axios.post('/api/school-info', { id: editing.id, ...form });
      } else {
        await axios.post('/api/school-info', form);
      }
      setModal(false); fetchSchools();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this school?')) return;
    try { await axios.delete(`/api/school-info/${id}`); fetchSchools(); }
    catch (err) { alert('Delete failed'); }
  };

  const handleLogoUpload = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('/api/upload/single', fd);
      setForm({ ...form, logo_url: res.data.url });
    } catch (err) { alert('Upload failed'); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">School Information</h2>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={openAdd}>Add School</button>
      </div>

      {message && <p className={`mb-3 text-sm ${message.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}

      {schools.length === 0 ? <p className="text-slate-500">No schools added yet.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {schools.map(s => (
            <div key={s.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {s.logo_url && <img src={s.logo_url} alt="" className="h-12 w-12 rounded border object-contain" />}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{s.school_name}</h3>
                    {s.principal_name && <p className="text-xs text-slate-500">Principal: {s.principal_name}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => openEdit(s)}>Edit</button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => handleDelete(s.id)}>Delete</button>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                {s.phone && <p>Phone: {s.phone}</p>}
                {s.email && <p>Email: {s.email}</p>}
                {s.website && <p>Website: {s.website}</p>}
                {s.affiliation && <p>Affiliation: {s.affiliation}</p>}
                {s.address && <p>Address: {s.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit School' : 'Add School'}</h3>

            {form.logo_url && (
              <div className="mb-4">
                <img src={form.logo_url} alt="Logo" className="h-20 w-20 rounded border object-contain" />
              </div>
            )}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-slate-600">School Logo</label>
              <input className="w-full rounded border p-2 text-sm" type="file" accept="image/*" onChange={e => e.target.files[0] && handleLogoUpload(e.target.files[0])} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input className="w-full rounded border p-3 text-sm" placeholder="School Name *" value={form.school_name} onChange={set('school_name')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Phone" value={form.phone} onChange={set('phone')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Email" value={form.email} onChange={set('email')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Website" value={form.website} onChange={set('website')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Principal Name" value={form.principal_name} onChange={set('principal_name')} />
              <input className="w-full rounded border p-3 text-sm" placeholder="Affiliation" value={form.affiliation} onChange={set('affiliation')} />
            </div>
            <textarea className="mt-3 w-full rounded border p-3 text-sm" placeholder="Address" rows={3} value={form.address} onChange={set('address')} />

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

export default SchoolInfo;
