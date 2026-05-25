const express = require('express');
const router = express.Router();
const { getAll, add, update, remove, setActive, promoteStudents } = require('../controllers/academicYearController');

router.get('/', getAll);
router.post('/add', add);
router.put('/:id', update);
router.put('/:id/activate', setActive);
router.delete('/:id', remove);
router.post('/promote', promoteStudents);

module.exports = router;
