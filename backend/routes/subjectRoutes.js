const express = require('express');
const router = express.Router();
const { addSubject, getAllSubjects, updateSubject, deleteSubject } = require('../controllers/subjectController');

router.post('/add', addSubject);
router.get('/all', getAllSubjects);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
