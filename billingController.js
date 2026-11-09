const { Op } = require('sequelize');
const { BillingStatement, Card, Transaction, Repayment } = require('../models');
const { calculateMinimumDue, getBillingDueDate } = require('../utils/calculations');

// @desc   Get all billing statements
// @route  GET /api/billing
const getBillingStatements = async (req, res, next) => {
  try {
    const { cardId, status } = req.query;
    const where = { userId: req.user.id };
    if (cardId) where.cardId = cardId;
    if (status) where.status = status;

    const statements = await BillingStatement.findAll({
      where,
      include: [
        { model: Card, as: 'card', attributes: ['id', 'cardName', 'bankName', 'lastFourDigits'] },
        { model: Repayment, as: 'repayments', attributes: ['id', 'amount', 'paymentDate', 'paymentMode'] },
      ],
      order: [['billingYear', 'DESC'], ['billingMonth', 'DESC']],
    });

    res.json({ success: true, count: statements.length, statements });
  } catch (error) {
    next(error);
  }
};

// @desc   Generate billing statement for a card/month
// @route  POST /api/billing/generate
const generateStatement = async (req, res, next) => {
  try {
    const { cardId, month, year } = req.body;

    const card = await Card.findOne({ where: { id: cardId, userId: req.user.id } });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found.' });

    // Check if statement already exists
    const existing = await BillingStatement.findOne({
      where: { cardId, userId: req.user.id, billingMonth: month, billingYear: year },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Statement already generated for this month.' });
    }

    // Calculate billing period
    const startDate = new Date(Date.UTC(year, month - 2, card.billingDate + 1));
    const endDate = new Date(Date.UTC(year, month - 1, card.billingDate));

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Purchases add to the statement; completed refunds reduce it.
    const transactions = await Transaction.findAll({
      where: {
        cardId,
        userId: req.user.id,
        status: 'completed',
        type: { [Op.in]: ['purchase', 'refund'] },
        transactionDate: { [Op.between]: [startStr, endStr] },
      },
    });

    const totalAmount = Math.max(0, transactions.reduce((sum, t) => sum + (t.type === 'refund' ? -1 : 1) * parseFloat(t.amount), 0));
    const minimumDue = calculateMinimumDue(totalAmount);
    const dueDate = getBillingDueDate(card.dueDate, month, year);
    const statementDate = new Date(Date.UTC(year, month - 1, card.billingDate));

    const statement = await BillingStatement.create({
      cardId,
      userId: req.user.id,
      billingMonth: month,
      billingYear: year,
      totalAmount,
      minimumDue,
      paidAmount: 0,
      remainingAmount: totalAmount,
      statementDate: statementDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: totalAmount > 0 ? 'unpaid' : 'paid',
    });

    res.status(201).json({ success: true, message: 'Statement generated!', statement });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single statement
// @route  GET /api/billing/:id
const getStatement = async (req, res, next) => {
  try {
    const statement = await BillingStatement.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Card, as: 'card' },
        { model: Repayment, as: 'repayments' },
      ],
    });
    if (!statement) return res.status(404).json({ success: false, message: 'Statement not found.' });
    res.json({ success: true, statement });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBillingStatements, generateStatement, getStatement };
