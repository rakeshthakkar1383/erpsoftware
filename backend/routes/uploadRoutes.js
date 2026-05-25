const express = require('express');
const router = express.Router();
const { upload, uploadFile, uploadMultiple } = require('../controllers/uploadController');

router.post('/single', upload.single('file'), uploadFile);
router.post('/multiple', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'birth_cert', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'father_aadhar', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]), uploadMultiple);

module.exports = router;
