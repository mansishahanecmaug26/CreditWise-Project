const express = require('express');
const { body } = require('express-validator');
const { getBillingStatements, generateStatement, getStatement } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getBillingStatements);
router.get('/:id', getStatement);

router.post('/generate', [
  body('cardId').isInt().withMessage('Card ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month (1-12) is required'),
  body('year').isInt({ min: 2020 }).withMessage('Valid year is required'),
], generateStatement);

module.exports = router;
