import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { FormActions, IconButton, monthName, PAYMENT_MODES, useLoad } from './userPageHelpers';

const blankRepayment = {
  statementId: '',
  cardId: '',
  amount: '',
  paymentDate: today(),
  paymentMode: 'UPI',
  notes: '',
};

export function RepaymentsPage() {
  const {
    items: repayments,
    loading,
    error,
    load,
  } = useLoad('/repayments', 'repayments');

  const [statements, setStatements] = useState([]);
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('list');
  const [editingRepayment, setEditingRepayment] = useState(null);
  const [form, setForm] = useState(blankRepayment);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState('');

  const openStatements = statements.filter((statement) => {
    const canReceivePayment = ['unpaid', 'partially_paid', 'overdue']
      .includes(statement.status);
    return Number(statement.remainingAmount) > 0 && canReceivePayment;
  });

  useEffect(() => {
    async function loadStatements() {
      try {
        const response = await api.get('/billing');
        const allStatements = response.data.statements || [];
        const statementIdFromUrl = searchParams.get('statementId');
        const selectedStatement = allStatements.find((statement) => (
          String(statement.id) === statementIdFromUrl
          && Number(statement.remainingAmount) > 0
        )) || allStatements.find((statement) => Number(statement.remainingAmount) > 0);

        setStatements(allStatements);
        if (selectedStatement) {
          setForm((currentForm) => ({
            ...currentForm,
            statementId: selectedStatement.id,
            cardId: selectedStatement.cardId,
          }));
        }
      } catch (requestError) {
        setActionError(requestError);
      }
    }

    loadStatements();
  }, [searchParams]);

  function selectStatement(statementId) {
    const statement = statements.find((item) => String(item.id) === String(statementId));
    setForm({
      ...form,
      statementId,
      cardId: statement?.cardId || '',
    });
  }

  function updateField(fieldName) {
    return (event) => {
      setForm({ ...form, [fieldName]: event.target.value });
    };
  }

  async function recordRepayment(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);

    try {
      await api.post('/repayments', {
        ...form,
        statementId: Number(form.statementId),
        cardId: Number(form.cardId),
        amount: Number(form.amount),
      });

      setNotice('Simulated repayment recorded. No money was transferred.');
      setMode('list');
      await Promise.all([
        load(),
        api.get('/billing').then((response) => {
          setStatements(response.data.statements || []);
        }),
      ]);
      setForm((currentForm) => ({ ...currentForm, amount: '', notes: '' }));
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function saveRepaymentNote(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);

    try {
      await api.put(`/repayments/${editingRepayment.id}`, { notes: form.notes });
      setEditingRepayment(null);
      setNotice('Repayment note corrected.');
      await load();
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setBusy(false);
    }
  }

  function editRepaymentNote(repayment) {
    setEditingRepayment(repayment);
    setForm({ ...form, notes: repayment.notes || '' });
  }

  return (
    <div>
      <PageHeader
        title="Repayments"
        description="Record simulated full or partial payments and keep a history of adjustments."
        action={
          <button
            className="btn-primary-cw"
            onClick={() => {
              setEditingRepayment(null);
              setMode('record');
            }}
            disabled={!openStatements.length}
          >
            <i className="fas fa-plus" /> Record repayment
          </button>
        }
      />

      {notice && (
        <Notice kind="success" onDismiss={() => setNotice('')}>
          {notice}
        </Notice>
      )}
      <Notice kind="info">
        Repayment entries are records only. CreditWise does not initiate or process payments.
      </Notice>
      <ErrorText error={actionError || error} />

      {mode === 'record' && (
        <Panel
          title="Record a repayment"
          subtitle="Choose a statement and enter the simulated payment details"
          className="form-panel"
        >
          <form onSubmit={recordRepayment}>
            <SelectField
              label="Statement"
              value={form.statementId}
              onChange={(event) => selectStatement(event.target.value)}
              required
            >
              <option value="">Select an unpaid statement</option>
              {openStatements.map((statement) => (
                <option value={statement.id} key={statement.id}>
                  {statement.card?.bankName} · {monthName(statement.billingMonth)}
                  {' '}{statement.billingYear} · Remaining {money(statement.remainingAmount)}
                </option>
              ))}
            </SelectField>

            <div className="form-row">
              <Field
                label="Amount (₹)"
                type="number"
                min="1"
                step="0.01"
                max={statements.find((statement) => (
                  String(statement.id) === String(form.statementId)
                ))?.remainingAmount || undefined}
                value={form.amount}
                onChange={updateField('amount')}
                required
              />
              <Field
                label="Payment date"
                type="date"
                value={form.paymentDate}
                onChange={updateField('paymentDate')}
                required
              />
            </div>

            <div className="form-row">
              <SelectField
                label="Payment mode"
                value={form.paymentMode}
                onChange={updateField('paymentMode')}
              >
                {PAYMENT_MODES.map((paymentMode) => (
                  <option key={paymentMode}>{paymentMode}</option>
                ))}
              </SelectField>
              <Field
                label="Note (optional)"
                value={form.notes}
                onChange={updateField('notes')}
                maxLength="255"
                placeholder="Personal reminder"
              />
            </div>

            <ErrorText error={actionError} />
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary-cw"
                onClick={() => setMode('list')}
              >
                Cancel
              </button>
              <button
                className="btn-primary-cw"
                disabled={busy || !openStatements.length}
              >
                {busy ? 'Saving…' : 'Record simulated payment'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {loading ? (
        <Loading />
      ) : (
        <Panel title="Repayment history" subtitle={`${repayments.length} payment records`}>
          {repayments.length ? (
            <TableWrap>
              <thead>
                <tr>
                  <th>Payment date</th>
                  <th>Statement</th>
                  <th>Card</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Record status</th>
                  <th>Note</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {repayments.map((repayment) => (
                  <tr key={repayment.id}>
                    <td>{dateLabel(repayment.paymentDate)}</td>
                    <td>
                      {monthName(repayment.statement?.billingMonth)}
                      {' '}{repayment.statement?.billingYear}
                    </td>
                    <td>
                      {repayment.card?.bankName}
                      <small className="table-subtext">{repayment.card?.cardName}</small>
                    </td>
                    <td>{repayment.paymentMode}</td>
                    <td><strong>{money(repayment.amount)}</strong></td>
                    <td><Status value={repayment.status} /></td>
                    <td>{repayment.notes || '—'}</td>
                    <td>
                      <IconButton
                        icon="fa-pen"
                        label="Correct note"
                        onClick={() => editRepaymentNote(repayment)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          ) : (
            <EmptyState icon="fa-money-bill-transfer" title="No repayment records">
              Once a statement has been generated, record a full or partial repayment here.
            </EmptyState>
          )}
        </Panel>
      )}

      {editingRepayment && (
        <Modal
          title="Correct repayment note"
          onClose={() => setEditingRepayment(null)}
        >
          <form onSubmit={saveRepaymentNote}>
            <Notice kind="info">
              Payment amounts and history are retained for record integrity. Only the note can be corrected.
            </Notice>
            <label className="field-wrap">
              <span className="form-label-cw">Note</span>
              <textarea
                className="form-control-cw textarea-cw"
                rows="4"
                maxLength="255"
                value={form.notes}
                onChange={updateField('notes')}
              />
            </label>
            <ErrorText error={actionError} />
            <FormActions
              onCancel={() => setEditingRepayment(null)}
              busy={busy}
              label="Save note"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
