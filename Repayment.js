const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Repayment = sequelize.define('Repayment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  statementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'billing_statements', key: 'id' },
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
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 1 },
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  paymentMode: {
    type: DataTypes.ENUM('UPI', 'Net Banking', 'Debit Card', 'NEFT', 'RTGS', 'Cash', 'Other'),
    defaultValue: 'UPI',
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('successful', 'failed', 'reversed'),
    defaultValue: 'successful',
  },
}, {
  tableName: 'repayments',
  timestamps: true,
});

module.exports = Repayment;
