import { useState, useEffect } from 'react';
import axios from 'axios';

function Signup({ onLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [className, setClassName] = useState('');
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const classList = Array.from({ length: 12 }, (_, i) => String(i + 1));

  useEffect(() => {
    axios.get('/api/teachers/all').then(r => setTeachers(r.data || [])).catch(() => {});
    axios.get('/api/school-info').then(r => setSchools(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) { setMessage('All fields are required'); return; }
    setLoading(true); setMessage('');
    try {
      const res = await axios.post('/api/auth/signup', {
        full_name: fullName, email, password, role,
        teacher_id: teacherId || null,
        class_name: role === 'admin' ? (className || null) : null,
        school_id: schoolId || null
      });
      if (res.data.success) {
        onLogin(res.data.token, res.data.user);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">Create Account</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Register a new user</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input className="w-full rounded-lg border p-3 text-sm" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input className="w-full rounded-lg border p-3 text-sm" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input className="w-full rounded-lg border p-3 text-sm" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select className="w-full rounded-lg border p-3 text-sm" value={role} onChange={e => setRole(e.target.value)}>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {role === 'teacher' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Link to Teacher</label>
              <select className="w-full rounded-lg border p-3 text-sm" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                <option value="">Select teacher (optional)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">School</label>
            <select className="w-full rounded-lg border p-3 text-sm" value={schoolId} onChange={e => setSchoolId(e.target.value)}>
              <option value="">Select school</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.school_name}</option>
              ))}
            </select>
          </div>
          {role === 'admin' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Restrict to Class (optional)</label>
              <select className="w-full rounded-lg border p-3 text-sm" value={className} onChange={e => setClassName(e.target.value)}>
                <option value="">All classes (super admin)</option>
                {classList.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Leave empty for full admin access to all classes</p>
            </div>
          )}
          {message && <p className="text-sm text-red-600">{message}</p>}
          <button className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <a className="text-blue-600 hover:underline" href="/">Sign in</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
