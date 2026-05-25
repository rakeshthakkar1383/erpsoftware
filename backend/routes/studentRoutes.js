const express = require('express');
const router = express.Router();
const {
  addStudent,
  getAllStudents,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');

router.post('/add', addStudent);
router.get('/all', getAllStudents);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
