import { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelActions from '../components/ExcelActions';

const emptyForm = { student_id: '', particulars: [], status: 'Paid', payment_date: '' };

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

function Fees({ user, teacherClass }) {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeParticulars, setFeeParticulars] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterClass, setFilterClass] = useState('');
  const [filterDiv, setFilterDiv] = useState('');
  const [filterAy, setFilterAy] = useState('');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState('');

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const set = (field) => (e) => setForm({ ...form, [field]: field === 'status' ? e.target.value : e.target.value.toUpperCase() });

  const fetchData = async () => {
    try { const r = await axios.get('/api/fees/all'); setFees(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/students/all'); setStudents(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/fee-particulars'); setFeeParticulars(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/divisions'); setDivisions(r.data || []); } catch (e) { console.error(e); }
    try { const r = await axios.get('/api/academic-years'); setAcademicYears(r.data || []); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (teacherClass) setFilterClass(teacherClass); }, [teacherClass]);

  const filteredStudents = students.filter(s => {
    if (filterClass && s.class_name !== filterClass) return false;
    if (filterDiv && s.division !== filterDiv) return false;
    if (filterAy && String(s.academic_year_id) !== filterAy) return false;
    return true;
  });
  const filteredStudentIds = new Set(filteredStudents.map(s => s.id));
  const q = search.toLowerCase();
  const filtered = fees.filter(f => {
    if (!filteredStudentIds.has(f.student_id)) return false;
    if (!q) return true;
    const s = studentMap[f.student_id];
    return [f.amount, f.status, f.payment_date, s?.full_name, s?.class_name].some(v => v?.toLowerCase().includes(q));
  });

  const getParticularsForClass = (className) => {
    return feeParticulars.filter(p => p.class_name === className);
  };

  const handleStudentSelect = (studentId) => {
    const s = studentMap[studentId];
    const classParticulars = getParticularsForClass(s?.class_name || '');
    const particulars = classParticulars.map(p => ({
      particular_name: p.particular_name,
      amount: String(p.amount)
    }));
    setForm({ ...form, student_id: studentId, particulars });
  };

  const setParticularAmount = (index) => (e) => {
    const updated = [...form.particulars];
    updated[index] = { ...updated[index], amount: e.target.value };
    setForm({ ...form, particulars: updated });
  };

  const totalAmount = form.particulars.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const openAdd = () => {
    setEditing(null); setForm({ ...emptyForm }); setMessage(''); setModal(true);
  };

  const openEdit = (f) => {
    const particulars = (f.particulars && f.particulars.length > 0)
      ? f.particulars
      : [{ particular_name: 'Tuition Fee', amount: String(f.amount) }];
    setEditing(f); setForm({ ...f, particulars }); setMessage(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.student_id) { setMessage('Select a student'); return; }
    if (form.particulars.length === 0 || form.particulars.every(p => !p.amount || Number(p.amount) === 0)) {
      setMessage('At least one fee particular with amount is required');
      return;
    }
    const payload = {
      ...form,
      particulars: form.particulars.filter(p => Number(p.amount) > 0)
    };
    try {
      if (editing) { await axios.put(`/api/fees/${editing.id}`, payload); }
      else { await axios.post('/api/fees/add', payload); }
      setModal(false); fetchData();
    } catch (err) { setMessage(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee record?')) return;
    try { await axios.delete(`/api/fees/${id}`); fetchData(); }
    catch (err) { alert('Delete failed'); }
  };

  const downloadBlob = async (url, filename) => {
    try {
      const res = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const objUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(objUrl), 1000);
    } catch (err) {
      alert('Download failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const viewReceipt = (id) => {
    downloadBlob(`/api/fees/receipt/${id}?download=1`, `receipt_${id}.pdf`);
  };

  const downloadReceipt = (id) => {
    downloadBlob(`/api/fees/receipt/${id}?download=1`, `receipt_${id}.pdf`);
  };

  const downloadReport = () => {
    const params = new URLSearchParams();
    if (filterClass) params.set('class_name', filterClass);
    if (filterDiv) params.set('division', filterDiv);
    if (filterAy) params.set('academic_year_id', filterAy);
    downloadBlob(`/api/fees/export?${params.toString()}`, 'fees_report.xlsx');
  };

  const ayMap = {};
  academicYears.forEach(y => { ayMap[y.id] = y; });

  if (loading) return <p>Loading fees...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Fees</h2>
        <div className="flex items-center gap-2">
          <ExcelActions entity="fees" onImport={fetchData} />
          <button className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700" onClick={downloadReport}>Download Report</button>
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
        <select className="rounded border p-2 text-sm" value={filterAy} onChange={e => setFilterAy(e.target.value)}>
          <option value="">All Years</option>
          {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
        </select>
        <span className="self-center text-sm text-slate-500">{filtered.length} records</span>
      </div>

      {filtered.length === 0 ? <p>No fee records found.</p> : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filtered.map((f, i) => {
                const s = studentMap[f.student_id];
                return (
                  <tr key={f.id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{s ? `${s.full_name} (${s.class_name})` : f.student_id}</td>
                    <td className="px-3 py-2">{Number(f.amount).toFixed(2)}</td>
                    <td className="px-3 py-2">{f.status}</td>
                    <td className="px-3 py-2">{f.payment_date || '-'}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <button className="text-blue-600 hover:underline" onClick={() => openEdit(f)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(f.id)}>Delete</button>
                      <button className="text-green-600 hover:underline" onClick={() => viewReceipt(f.id)}>Receipt</button>
                      <button className="text-green-600 hover:underline" onClick={() => downloadReceipt(f.id)}>Download</button>
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-semibold">{editing ? 'Edit Fee Record' : 'Add Fee Record'}</h3>
            <div className="grid gap-3">
              <select className="w-full rounded border p-3 text-sm" value={form.student_id} onChange={e => handleStudentSelect(e.target.value)}>
                <option value="">Select Student *</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.class_name}{s.division ? ` - ${s.division}` : ''})</option>
                ))}
              </select>

              <div className="rounded border bg-slate-50 p-3">
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Fee Particulars</h4>
                {form.particulars.length === 0 ? (
                  <p className="text-xs text-slate-500">No fee particulars defined for this class. Add them in Fee Particulars tab.</p>
                ) : (
                  <div className="space-y-2">
                    {form.particulars.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-medium text-slate-600">{p.particular_name}</span>
                        <input
                          className="w-40 rounded border p-2 text-sm text-right"
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={p.amount}
                          onChange={setParticularAmount(i)}
                        />
                      </div>
                    ))}
                    <div className="flex items-center gap-2 border-t pt-2">
                      <span className="flex-1 text-sm font-bold text-slate-800">Total</span>
                      <span className="w-40 text-right text-sm font-bold text-slate-800">{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <select className="w-full rounded border p-3 text-sm" value={form.status} onChange={set('status')}>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
              <input className="w-full rounded border p-3 text-sm" type="date" placeholder="Payment Date" value={form.payment_date} onChange={set('payment_date')} />
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

export default Fees;
