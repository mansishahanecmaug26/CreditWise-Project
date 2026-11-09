const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Transaction, Card, BillingStatement } = require('../models');

const hasGeneratedStatementFor = async (transaction) => {
  const card = await Card.findOne({ where: { id: transaction.cardId, userId: transaction.userId } });
  if (!card) return false;
  const statements = await BillingStatement.findAll({
    where: { cardId: transaction.cardId, userId: transaction.userId },
    attributes: ['billingMonth', 'billingYear'],
  });
  const [txYear, txMonth, txDay] = String(transaction.transactionDate).slice(0, 10).split('-').map(Number);
  const txDate = Date.UTC(txYear, txMonth - 1, txDay);
  return statements.some((statement) => {
    const month = Number(statement.billingMonth);
    const year = Number(statement.billingYear);
    const start = Date.UTC(year, month - 2, Number(card.billingDate) + 1);
    const end = Date.UTC(year, month - 1, Number(card.billingDate));
    return txDate >= start && txDate <= end;
  });
};

// @desc   Get all transactions for user
// @route  GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { cardId, category, startDate, endDate, limit = 50, offset = 0 } = req.query;
    const where = { userId: req.user.id };

    if (cardId) where.cardId = cardId;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.transactionDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Card, as: 'card', attributes: ['id', 'cardName', 'bankName', 'lastFourDigits'] }],
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ success: true, count, transactions });
  } catch (error) {
    next(error);
  }
};

// @desc   Add transaction
// @route  POST /api/transactions
const addTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { cardId, description, category, amount, transactionDate, type } = req.body;

    // Verify card belongs to user
    const card = await Card.findOne({ where: { id: cardId, userId: req.user.id, status: 'active' } });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found.' });

    const transaction = await Transaction.create({
      cardId, userId: req.user.id, description, category, amount, transactionDate, type: type || 'purchase',
    });

    // Update card outstanding
    if (type === 'refund') {
      card.currentOutstanding = Math.max(0, parseFloat(card.currentOutstanding) - parseFloat(amount));
    } else {
      card.currentOutstanding = parseFloat(card.currentOutstanding) + parseFloat(amount);
    }
    await card.save();

    res.status(201).json({ success: true, message: 'Transaction added!', transaction });
  } catch (error) {
    next(error);
  }
};

// @desc   Update transaction
// @route  PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const { description, category, amount, transactionDate, type, status } = req.body;

    const affectsStatement = (
      (amount !== undefined && parseFloat(amount) !== parseFloat(transaction.amount)) ||
      (type !== undefined && type !== transaction.type) ||
      (status !== undefined && status !== transaction.status) ||
      (transactionDate !== undefined && transactionDate !== String(transaction.transactionDate).slice(0, 10))
    );
    if (affectsStatement && await hasGeneratedStatementFor(transaction)) {
      return res.status(409).json({ success: false, message: 'A statement already includes this transaction. Keep that statement unchanged and record a refund or adjustment instead.' });
    }

    // Reverse old amount and apply new amount to card outstanding
    const card = await Card.findByPk(transaction.cardId);
    if (card) {
      const oldEffect = transaction.status === 'completed'
        ? (transaction.type === 'refund' ? -parseFloat(transaction.amount) : parseFloat(transaction.amount))
        : 0;
      const nextAmount = amount === undefined ? parseFloat(transaction.amount) : parseFloat(amount);
      const nextType = type || transaction.type;
      const nextStatus = status || transaction.status;
      const newEffect = nextStatus === 'completed'
        ? (nextType === 'refund' ? -nextAmount : nextAmount)
        : 0;
      if (oldEffect !== newEffect) {
        card.currentOutstanding = Math.max(0, parseFloat(card.currentOutstanding) - oldEffect + newEffect);
      }
      if (oldEffect !== newEffect) {
      await card.save();
      }
    }

    await transaction.update({ description, category, amount, transactionDate, type, status });
    res.json({ success: true, message: 'Transaction updated!', transaction });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete transaction
// @route  DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const inGeneratedStatement = await hasGeneratedStatementFor(transaction);
    if (inGeneratedStatement && transaction.status === 'reversed') {
      return res.json({ success: true, message: 'Transaction was already reversed.' });
    }

    // Reverse effect on card outstanding
    const card = await Card.findByPk(transaction.cardId);
    if (card && transaction.status === 'completed') {
      if (transaction.type === 'purchase') {
        card.currentOutstanding = Math.max(0, parseFloat(card.currentOutstanding) - parseFloat(transaction.amount));
      } else {
        card.currentOutstanding = parseFloat(card.currentOutstanding) + parseFloat(transaction.amount);
      }
      await card.save();
    }

    if (inGeneratedStatement) {
      await transaction.update({ status: 'reversed' });
      res.json({ success: true, message: 'Transaction reversed and retained with its generated statement.' });
    } else {
      await transaction.destroy();
      res.json({ success: true, message: 'Transaction deleted.' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction };
