const express = require('express');
const router = express.Router();
const { downloadTemplate, importExcel, upload } = require('../controllers/excelController');

router.get('/template/:entity', downloadTemplate);
router.post('/import/:entity', upload.single('file'), importExcel);

module.exports = router;
