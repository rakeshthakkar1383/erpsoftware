const express = require('express');
const router = express.Router();
const {
  addTeacher,
  getAllTeachers,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teacherController');

router.post('/add', addTeacher);
router.get('/all', getAllTeachers);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

module.exports = router;
