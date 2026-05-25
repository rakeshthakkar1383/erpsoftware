const express = require('express');
const router = express.Router();
const {
  addFee,
  getAllFees,
  getFeesByStudent,
  updateFee,
  deleteFee,
  getFeeReceipt,
  exportFees
} = require('../controllers/feeController');

router.get('/export', exportFees);
router.post('/add', addFee);
router.get('/all', getAllFees);
router.get('/student/:student_id', getFeesByStudent);
router.get('/receipt/:id', getFeeReceipt);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

module.exports = router;
