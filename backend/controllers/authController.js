const supabase = require('../supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function signup(req, res) {
  try {
    const { email, password, full_name, role, teacher_id, class_name, school_id } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Email, password and name are required' });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase.from('users').insert([{
      email, password: hashedPassword, full_name,
      role: role || 'teacher',
      teacher_id: teacher_id || null,
      class_name: class_name || null,
      school_id: school_id || null
    }]).select().single();

    if (error && error.message?.includes('school_id') && error.message?.includes('column')) {
      const { data: user2, error2 } = await supabase.from('users').insert([{
        email, password: hashedPassword, full_name,
        role: role || 'teacher',
        teacher_id: teacher_id || null,
        class_name: class_name || null
      }]).select().single();
      if (error2) return res.status(400).json({ success: false, message: error2.message });
      const { password: _, ...userData2 } = user2;
      const token2 = jwt.sign(
        { id: user2.id, email: user2.email, role: user2.role, teacher_id: user2.teacher_id, full_name: user2.full_name, class_name: user2.class_name, school_id: user2.school_id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ success: true, message: 'Account created', token: token2, user: userData2 });
    }

    if (error) return res.status(400).json({ success: false, message: error.message });

    const { password: _, ...userData } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, teacher_id: user.teacher_id, full_name: user.full_name, class_name: user.class_name, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, message: 'Account created', token, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { password: _, ...userData } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, teacher_id: user.teacher_id, full_name: user.full_name, class_name: user.class_name, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, message: 'Login successful', token, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a reset token has been generated' });
    }

    const resetToken = jwt.sign({ id: user.id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await supabase.from('users').update({ password: resetToken }).eq('id', user.id);

    res.json({ success: true, message: 'Reset token generated', reset_token: resetToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('id', decoded.id);

    if (error) return res.status(400).json({ success: false, message: error.message });

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getMe(req, res) {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (error) return res.status(404).json({ success: false, message: 'User not found' });
  const { password: _, ...userData } = user;
  res.json({ success: true, user: userData });
}

module.exports = { signup, login, forgotPassword, resetPassword, getMe };
