const express = require('express');
const router = express.Router();
const {
  addMark,
  getAllMarks,
  getMarksByStudent,
  updateMark,
  deleteMark
} = require('../controllers/markController');

router.post('/add', addMark);
router.get('/all', getAllMarks);
router.get('/student/:student_id', getMarksByStudent);
router.put('/:id', updateMark);
router.delete('/:id', deleteMark);

module.exports = router;
