import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  EmptyState,
  ErrorText,
  Field,
  Loading,
  Modal,
  Notice,
  PageHeader,
  Panel,
  SelectField,
  Status,
  TableWrap,
  dateLabel,
  money,
  today,
} from '../components/ui';
import { CATEGORIES, FormActions, IconButton, useLoad } from './userPageHelpers';

const blankTransaction = {
  cardId: '',
  description: '',
  category: 'Shopping',
  amount: '',
  transactionDate: today(),
  type: 'purchase',
};

export function TransactionsPage() {
  const {
    items: transactions,
    loading,
    error,
    load,
  } = useLoad('/transactions?limit=200', 'transactions');

  const [cards, setCards] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState(blankTransaction);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.get('/cards')
      .then((response) => setCards(response.data.cards || []))
      .catch(setActionError);
  }, []);

  function openForm(transaction) {
    setActionError(null);
    setEditingTransaction(transaction || {});

    if (transaction) {
      setForm({
        ...transaction,
        transactionDate: String(transaction.transactionDate).slice(0, 10),
      });
      return;
    }

    setForm({ ...blankTransaction, cardId: cards[0]?.id || '' });
  }

  function updateField(fieldName) {
    return (event) => {
      setForm({ ...form, [fieldName]: event.target.value });
    };
  }

  async function saveTransaction(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);

    try {
      const transactionData = { ...form, amount: Number(form.amount) };

      if (editingTransaction?.id) {
        await api.put(`/transactions/${editingTransaction.id}`, transactionData);
        setNotice('Transaction updated.');
      } else {
        await api.post('/transactions', transactionData);
        setNotice('Transaction recorded.');
      }

      setEditingTransaction(null);
      await load();
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTransaction(transaction) {
    const shouldDelete = window.confirm(
      'Delete or reverse this transaction and adjust the card balance?',
    );
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await api.delete(`/transactions/${transaction.id}`);
      setNotice(response.data.message);
      await load();
    } catch (requestError) {
      setActionError(requestError);
    }
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Record purchases and refunds against a card. Balances update with each entry."
        action={
          <button
            className="btn-primary-cw"
            onClick={() => openForm(null)}
            disabled={!cards.length}
          >
            <i className="fas fa-plus" /> Add transaction
          </button>
        }
      />

      {notice && (
        <Notice kind="success" onDismiss={() => setNotice('')}>
          {notice}
        </Notice>
      )}
      <ErrorText error={actionError || error} />

      {loading ? (
        <Loading />
      ) : (
        <Panel title="Activity ledger" subtitle={`${transactions.length} recorded transactions`}>
          {transactions.length ? (
            <TableWrap>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Card</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <strong>{transaction.description}</strong>
                      <small className="table-subtext">
                        {transaction.type === 'refund' ? 'Refund' : 'Purchase'}
                      </small>
                    </td>
                    <td>
                      {transaction.card?.bankName}
                      <small className="table-subtext">{transaction.card?.cardName}</small>
                    </td>
                    <td>{transaction.category}</td>
                    <td>{dateLabel(transaction.transactionDate)}</td>
                    <td><Status value={transaction.status} /></td>
                    <td className={transaction.type === 'refund' ? 'amount-credit' : ''}>
                      {transaction.type === 'refund' ? '+' : '−'}{money(transaction.amount)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <IconButton
                          icon="fa-pen"
                          label="Edit transaction"
                          onClick={() => openForm(transaction)}
                        />
                        {transaction.status !== 'reversed' && (
                          <IconButton
                            icon="fa-trash"
                            label="Delete or reverse transaction"
                            tone="danger"
                            onClick={() => deleteTransaction(transaction)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          ) : (
            <EmptyState
              icon="fa-receipt"
              title="No transactions yet"
              action={
                <button
                  className="btn-primary-cw"
                  onClick={() => openForm(null)}
                  disabled={!cards.length}
                >
                  Record a transaction
                </button>
              }
            >
              Purchases and refunds will appear here once recorded.
            </EmptyState>
          )}
        </Panel>
      )}

      {editingTransaction && (
        <Modal
          title={editingTransaction.id ? 'Edit transaction' : 'Record transaction'}
          onClose={() => setEditingTransaction(null)}
        >
          <form onSubmit={saveTransaction}>
            <SelectField
              label="Card"
              value={form.cardId}
              onChange={updateField('cardId')}
              required
            >
              {cards.map((card) => (
                <option value={card.id} key={card.id}>
                  {card.bankName} · {card.cardName} (••{card.lastFourDigits})
                </option>
              ))}
            </SelectField>

            <Field
              label="Description"
              value={form.description}
              onChange={updateField('description')}
              required
              maxLength="255"
              placeholder="Groceries"
            />

            <div className="form-row">
              <SelectField
                label="Category"
                value={form.category}
                onChange={updateField('category')}
              >
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </SelectField>
              <SelectField
                label="Type"
                value={form.type}
                onChange={updateField('type')}
              >
                <option value="purchase">Purchase</option>
                <option value="refund">Refund</option>
              </SelectField>
            </div>

            <div className="form-row">
              <Field
                label="Amount (₹)"
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={updateField('amount')}
                required
              />
              <Field
                label="Date"
                type="date"
                value={form.transactionDate}
                onChange={updateField('transactionDate')}
                required
              />
            </div>

            <ErrorText error={actionError} />
            <FormActions
              onCancel={() => setEditingTransaction(null)}
              busy={busy}
              label={editingTransaction.id ? 'Save transaction' : 'Record transaction'}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
