const express = require('express');
const router = express.Router();
const {
  addExam,
  getAllExams,
  updateExam,
  deleteExam
} = require('../controllers/examController');

router.post('/add', addExam);
router.get('/all', getAllExams);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

module.exports = router;
