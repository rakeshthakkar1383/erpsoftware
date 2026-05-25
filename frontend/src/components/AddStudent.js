import { useState } from 'react';
import axios from 'axios';

const emptyForm = {
  full_name: '',
  gender: '',
  father_name: '',
  mother_name: '',
  dob: '',
  birthplace: '',
  address: '',
  village: '',
  district: '',
  division: '',
  class_name: ''
};

function AddStudent() {
  const [form, setForm] = useState({ ...emptyForm });
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value.toUpperCase() });

  const submitForm = async () => {
    if (!form.full_name || !form.class_name) {
      setMessage('Student Name and Class are required');
      return;
    }
    try {
      const res = await axios.post('/api/students/add', form);
      if (res.data.success) {
        setEntries([{ ...form, id: entries.length + 1 }, ...entries]);
        setMessage('Student Added');
        setForm({ ...emptyForm });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        error.message ||
        'Unable to save student';
      setMessage(`Unable to save student: ${errorMessage}`);
    }
  };

  const input = (field, placeholder, type = 'text') => (
    <input
      className="w-full rounded border p-3 text-sm"
      type={type}
      placeholder={placeholder}
      value={form[field]}
      onChange={set(field)}
    />
  );

  const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Add Student</h2>

      <div className="grid gap-3 md:grid-cols-3">
        {input('full_name', 'Student Name *')}
        <select
          className="w-full rounded border p-3 text-sm"
          value={form.gender}
          onChange={set('gender')}
        >
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {input('father_name', "Father's Name")}
        {input('mother_name', "Mother's Name")}
        {input('dob', 'Birth Date', 'date')}
        {input('birthplace', 'Birth Place')}
        {input('address', 'Address')}
        {input('village', 'Village')}
        {input('district', 'District')}
        {input('division', 'Division')}
        <select
          className="w-full rounded border p-3 text-sm"
          value={form.class_name}
          onChange={set('class_name')}
        >
          <option value="">Class *</option>
          {classes.map((c) => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
      </div>

      <button
        className="mt-4 w-full rounded bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        type="button"
        onClick={submitForm}
      >
        Save Student
      </button>

      {message && (
        <p className="mt-3 text-sm text-slate-700">{message}</p>
      )}

      {entries.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded border">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Gender</th>
                <th className="px-3 py-2">Father</th>
                <th className="px-3 py-2">Mother</th>
                <th className="px-3 py-2">DOB</th>
                <th className="px-3 py-2">Birth Place</th>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">Village</th>
                <th className="px-3 py-2">District</th>
                <th className="px-3 py-2">Division</th>
                <th className="px-3 py-2">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {entries.map((e, i) => (
                <tr key={e.id}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{e.full_name}</td>
                  <td className="px-3 py-2">{e.gender}</td>
                  <td className="px-3 py-2">{e.father_name}</td>
                  <td className="px-3 py-2">{e.mother_name}</td>
                  <td className="px-3 py-2">{e.dob}</td>
                  <td className="px-3 py-2">{e.birthplace}</td>
                  <td className="px-3 py-2">{e.address}</td>
                  <td className="px-3 py-2">{e.village}</td>
                  <td className="px-3 py-2">{e.district}</td>
                  <td className="px-3 py-2">{e.division}</td>
                  <td className="px-3 py-2">{e.class_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AddStudent;
