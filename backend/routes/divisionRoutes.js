const express = require('express');
const router = express.Router();
const { getAll, add, update, remove } = require('../controllers/divisionController');

router.get('/', getAll);
router.post('/add', add);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
