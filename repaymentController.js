const { validationResult } = require('express-validator');
const { Repayment, BillingStatement, Card } = require('../models');
const { sequelize } = require('../config/db');

// @desc   Record a repayment
// @route  POST /api/repayments
const recordRepayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { statementId, cardId, amount, paymentDate, paymentMode, notes } = req.body;

    const parsedAmount = parseFloat(amount);
    let repayment;
    let failure;
    await sequelize.transaction(async (dbTransaction) => {
      const statement = await BillingStatement.findOne({
        where: { id: statementId, userId: req.user.id },
        transaction: dbTransaction,
        lock: dbTransaction.LOCK.UPDATE,
      });
      if (!statement) { failure = { status: 404, message: 'Statement not found.' }; return; }
      if (Number(statement.cardId) !== Number(cardId)) {
        failure = { status: 400, message: 'The selected card does not match this statement.' };
        return;
      }

      const card = await Card.findOne({
        where: { id: statement.cardId, userId: req.user.id },
        transaction: dbTransaction,
        lock: dbTransaction.LOCK.UPDATE,
      });
      if (!card) { failure = { status: 404, message: 'Card not found.' }; return; }

      const remainingAmount = parseFloat(statement.remainingAmount);
      if (parsedAmount > remainingAmount) {
        failure = { status: 400, message: `Payment amount (₹${parsedAmount}) exceeds remaining balance (₹${remainingAmount}).` };
        return;
      }

      repayment = await Repayment.create({
        statementId, cardId: statement.cardId, userId: req.user.id,
        amount: parsedAmount, paymentDate, paymentMode, notes,
      }, { transaction: dbTransaction });

      const newPaid = parseFloat(statement.paidAmount) + parsedAmount;
      const newRemaining = Math.max(0, parseFloat(statement.totalAmount) - newPaid);
      const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';
      await statement.update({ paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus }, { transaction: dbTransaction });
      card.currentOutstanding = Math.max(0, parseFloat(card.currentOutstanding) - parsedAmount);
      await card.save({ transaction: dbTransaction });
    });

    if (failure) return res.status(failure.status).json({ success: false, message: failure.message });

    res.status(201).json({ success: true, message: 'Repayment recorded!', repayment });
  } catch (error) {
    next(error);
  }
};

// @desc   Get repayment history
// @route  GET /api/repayments
const getRepayments = async (req, res, next) => {
  try {
    const { cardId, statementId } = req.query;
    const where = { userId: req.user.id };
    if (cardId) where.cardId = cardId;
    if (statementId) where.statementId = statementId;

    const repayments = await Repayment.findAll({
      where,
      include: [
        { model: Card, as: 'card', attributes: ['id', 'cardName', 'bankName', 'lastFourDigits'] },
        { model: BillingStatement, as: 'statement', attributes: ['id', 'billingMonth', 'billingYear', 'totalAmount'] },
      ],
      order: [['paymentDate', 'DESC']],
    });

    res.json({ success: true, count: repayments.length, repayments });
  } catch (error) {
    next(error);
  }
};

// @desc   Update repayment (correction)
// @route  PUT /api/repayments/:id
const updateRepayment = async (req, res, next) => {
  try {
    const repayment = await Repayment.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!repayment) return res.status(404).json({ success: false, message: 'Repayment not found.' });

    const { notes } = req.body;
    if (req.body.status !== undefined) {
      return res.status(400).json({ success: false, message: 'Repayment status is preserved for financial history. Correct the note instead.' });
    }
    await repayment.update({ notes });
    res.json({ success: true, message: 'Repayment updated.', repayment });
  } catch (error) {
    next(error);
  }
};

module.exports = { recordRepayment, getRepayments, updateRepayment };
