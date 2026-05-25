import { useState } from 'react';
import axios from 'axios';

function ForgotPassword() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setMessage('Enter your email'); return; }
    setLoading(true); setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token);
        setStep('reset');
      }
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) { setMessage('Enter new password'); return; }
    setLoading(true); setMessage('');
    try {
      const res = await axios.post('/api/auth/reset-password', { token: resetToken, new_password: newPassword });
      setMessage(res.data.message);
      if (res.data.success) {
        setTimeout(() => window.location.href = '/', 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">Reset Password</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {step === 'email' ? 'Enter your email to receive a reset token' : 'Enter your new password'}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input className="w-full rounded-lg border p-3 text-sm" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            {message && <p className="text-sm text-green-600">{message}</p>}
            <button className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <input className="w-full rounded-lg border p-3 text-sm" type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            {message && <p className="text-sm text-green-600">{message}</p>}
            <button className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          <a className="text-blue-600 hover:underline" href="/">Back to login</a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
