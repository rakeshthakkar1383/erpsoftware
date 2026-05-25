const express = require('express');
const router = express.Router();
const { getAll, add, remove } = require('../controllers/teacherSubjectController');

router.get('/', getAll);
router.post('/add', add);
router.delete('/:id', remove);

module.exports = router;
