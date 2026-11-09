import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from '../components/ui';
import { FormActions, monthName, useLoad } from './userPageHelpers';

export function BillingPage() {
  const {
    items: statements,
    loading,
    error,
    load,
  } = useLoad('/billing', 'statements');

  const [cards, setCards] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    cardId: '',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.get('/cards')
      .then((response) => {
        const activeCards = (response.data.cards || [])
          .filter((card) => card.status === 'active');
        setCards(activeCards);
        setForm((currentForm) => ({
          ...currentForm,
          cardId: activeCards[0]?.id || '',
        }));
      })
      .catch(setActionError);
  }, []);

  function updateField(fieldName) {
    return (event) => {
      setForm({ ...form, [fieldName]: event.target.value });
    };
  }

  async function generateStatement(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);

    try {
      await api.post('/billing/generate', {
        ...form,
        cardId: Number(form.cardId),
        month: Number(form.month),
        year: Number(form.year),
      });

      setIsFormOpen(false);
      setNotice('Billing statement generated.');
      await load();
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Billing statements"
        description="Generate monthly statements from completed purchases and track outstanding balances."
        action={
          <button
            className="btn-primary-cw"
            onClick={() => setIsFormOpen(true)}
            disabled={!cards.length}
          >
            <i className="fas fa-file-circle-plus" /> Generate statement
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
        <Panel title="Statements" subtitle={`${statements.length} billing cycles`}>
          {statements.length ? (
            <TableWrap>
              <thead>
                <tr>
                  <th>Statement</th>
                  <th>Card</th>
                  <th>Statement date</th>
                  <th>Due date</th>
                  <th>Total amount</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {statements.map((statement) => (
                  <tr key={statement.id}>
                    <td>
                      <strong>
                        {monthName(statement.billingMonth)} {statement.billingYear}
                      </strong>
                      <small className="table-subtext">
                        Minimum due {money(statement.minimumDue)}
                      </small>
                    </td>
                    <td>
                      {statement.card?.bankName}
                      <small className="table-subtext">{statement.card?.cardName}</small>
                    </td>
                    <td>{dateLabel(statement.statementDate)}</td>
                    <td>{dateLabel(statement.dueDate)}</td>
                    <td>{money(statement.totalAmount)}</td>
                    <td><strong>{money(statement.remainingAmount)}</strong></td>
                    <td><Status value={statement.status} /></td>
                    <td>
                      {Number(statement.remainingAmount) > 0 && (
                        <Link
                          className="btn-secondary-cw compact-button"
                          to={`/repayments?statementId=${statement.id}`}
                        >
                          Record payment
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          ) : (
            <EmptyState
              icon="fa-file-invoice-dollar"
              title="No statements generated"
              action={
                <button
                  className="btn-primary-cw"
                  onClick={() => setIsFormOpen(true)}
                  disabled={!cards.length}
                >
                  Generate statement
                </button>
              }
            >
              Choose a card and billing month to calculate a statement from completed purchases.
            </EmptyState>
          )}
        </Panel>
      )}

      {isFormOpen && (
        <Modal title="Generate statement" onClose={() => setIsFormOpen(false)}>
          <form onSubmit={generateStatement}>
            <SelectField
              label="Card"
              value={form.cardId}
              onChange={updateField('cardId')}
              required
            >
              {cards.map((card) => (
                <option value={card.id} key={card.id}>
                  {card.bankName} · {card.cardName}
                </option>
              ))}
            </SelectField>

            <div className="form-row">
              <SelectField
                label="Billing month"
                value={form.month}
                onChange={updateField('month')}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option value={index + 1} key={index}>
                    {monthName(index + 1)}
                  </option>
                ))}
              </SelectField>
              <Field
                label="Billing year"
                type="number"
                min="2020"
                max="2100"
                value={form.year}
                onChange={updateField('year')}
                required
              />
            </div>

            <p className="modal-help">
              The statement amount is calculated from completed purchases in the
              card’s billing period. Generating the same card and month twice is prevented.
            </p>
            <ErrorText error={actionError} />
            <FormActions
              onCancel={() => setIsFormOpen(false)}
              busy={busy}
              label="Generate statement"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
