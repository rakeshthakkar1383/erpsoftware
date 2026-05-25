const express = require('express');
const router = express.Router();
const { getAllSchools, getSchool, upsertSchoolInfo, deleteSchool } = require('../controllers/schoolInfoController');

router.get('/', getAllSchools);
router.get('/:id', getSchool);
router.post('/', upsertSchoolInfo);
router.delete('/:id', deleteSchool);

module.exports = router;
