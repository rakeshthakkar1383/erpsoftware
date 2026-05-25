const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const authenticateToken = require('./middleware/authMiddleware');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const feeRoutes = require('./routes/feeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const examRoutes = require('./routes/examRoutes');
const markRoutes = require('./routes/markRoutes');
const schoolInfoRoutes = require('./routes/schoolInfoRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const academicYearRoutes = require('./routes/academicYearRoutes');
const divisionRoutes = require('./routes/divisionRoutes');
const streamRoutes = require('./routes/streamRoutes');
const feeParticularRoutes = require('./routes/feeParticularRoutes');
const teacherSubjectRoutes = require('./routes/teacherSubjectRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const excelRoutes = require('./routes/excelRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use('/api/auth', authRoutes);
app.use('/api/school-info', schoolInfoRoutes);

// Protected routes (JWT required)
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
app.use('/api/fees', authenticateToken, feeRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/exams', authenticateToken, examRoutes);
app.use('/api/marks', authenticateToken, markRoutes);
app.use('/api/school-info', authenticateToken, schoolInfoRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/subjects', authenticateToken, subjectRoutes);
app.use('/api/academic-years', authenticateToken, academicYearRoutes);
app.use('/api/divisions', authenticateToken, divisionRoutes);
app.use('/api/streams', authenticateToken, streamRoutes);
app.use('/api/fee-particulars', authenticateToken, feeParticularRoutes);
app.use('/api/teacher-subjects', authenticateToken, teacherSubjectRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/excel', authenticateToken, excelRoutes);

app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
