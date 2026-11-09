const express = require('express');
const { body } = require('express-validator');
const { getTransactions, addTransaction, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getTransactions);

router.post('/', [
  body('cardId').isInt().withMessage('Card ID is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('transactionDate').isDate().withMessage('Valid date is required'),
], addTransaction);

router.put('/:id', [
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('amount').optional().isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('transactionDate').optional().isDate().withMessage('Valid date is required'),
  body('type').optional().isIn(['purchase', 'refund']).withMessage('Type must be purchase or refund'),
  body('status').optional().isIn(['completed', 'pending', 'reversed']).withMessage('Invalid transaction status'),
], updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
