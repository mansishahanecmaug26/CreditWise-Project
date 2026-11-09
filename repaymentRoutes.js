const express = require('express');
const { body } = require('express-validator');
const { recordRepayment, getRepayments, updateRepayment } = require('../controllers/repaymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getRepayments);

router.post('/', [
  body('statementId').isInt().withMessage('Statement ID is required'),
  body('cardId').isInt().withMessage('Card ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('paymentDate').isDate().withMessage('Valid payment date is required'),
  body('paymentMode').notEmpty().withMessage('Payment mode is required'),
], recordRepayment);

router.put('/:id', updateRepayment);

module.exports = router;
