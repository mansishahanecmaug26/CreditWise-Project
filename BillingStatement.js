const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BillingStatement = sequelize.define('BillingStatement', {
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
  billingMonth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 12 },
  },
  billingYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  minimumDue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  statementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid', 'overdue'),
    defaultValue: 'unpaid',
  },
}, {
  tableName: 'billing_statements',
  timestamps: true,
  indexes: [{ unique: true, fields: ['cardId', 'userId', 'billingMonth', 'billingYear'], name: 'uniq_card_billing_cycle' }],
});

module.exports = BillingStatement;
