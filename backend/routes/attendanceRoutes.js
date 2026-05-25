const express = require('express');
const router = express.Router();
const {
  addAttendance,
  getAllAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');

router.post('/add', addAttendance);
router.get('/all', getAllAttendance);
router.get('/student/:student_id', getAttendanceByStudent);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;
