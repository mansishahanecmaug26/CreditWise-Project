const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'cards', key: 'id' },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('Shopping', 'Groceries', 'Travel', 'Food & Dining', 'Entertainment', 'Healthcare', 'Utilities', 'Fuel', 'Education', 'Other'),
    defaultValue: 'Other',
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 1 },
  },
  transactionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  type: {
    type: DataTypes.ENUM('purchase', 'refund'),
    defaultValue: 'purchase',
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'reversed'),
    defaultValue: 'completed',
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

module.exports = Transaction;
