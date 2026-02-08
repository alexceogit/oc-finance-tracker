import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, Debt, DebtPayment } from '../services/database';

function Debts() {
  const { t, i18n } = useTranslation();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState<Debt | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    note: ''
  });
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [formData, setFormData] = useState({
    personName: '',
    direction: 'borrow' as 'borrow' | 'lend',
    originalAmount: '',
    remainingAmount: '',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    loadDebts();
    loadPayments();
  }, []);

  async function loadDebts() {
    const allDebts = await db.debts.orderBy('createdAt').reverse().toArray();
    setDebts(allDebts);
  }

  async function loadPayments() {
    const allPayments = await db.debtPayments.orderBy('createdAt').reverse().toArray();
    setPayments(allPayments);
  }

  const formatCurrency = (amount: number) => {
    const savedCurrency = localStorage.getItem('currency') || 'TRY';
    const currencySymbols: Record<string, string> = {
      TRY: '₺',
      USD: '$',
      GBP: '£'
    };
    const currency = currencySymbols[savedCurrency] || '₺';
    return `${currency}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await db.debts.add({
      personName: formData.personName,
      direction: formData.direction,
      originalAmount: parseFloat(formData.originalAmount),
      remainingAmount: parseFloat(formData.remainingAmount || formData.originalAmount),
      description: formData.description,
      dueDate: formData.dueDate,
      status: 'pending',
      createdAt: new Date()
    });

    setShowForm(false);
    setFormData({
      personName: '',
      direction: 'borrow',
      originalAmount: '',
      remainingAmount: '',
      description: '',
      dueDate: ''
    });
    loadDebts();
  };

  const addPayment = async () => {
    if (!showPaymentDialog || !paymentForm.amount) return;
    
    const paymentAmount = parseFloat(paymentForm.amount);
    const newRemaining = Math.max(0, showPaymentDialog.remainingAmount - paymentAmount);
    
    // Add payment record
    await db.debtPayments.add({
      debtId: showPaymentDialog.id!,
      amount: paymentAmount,
      paymentDate: paymentForm.date,
      month: paymentForm.month,
      year: paymentForm.year,
      note: paymentForm.note,
      createdAt: new Date()
    });

    // Update debt status and remaining amount
    await db.debts.update(showPaymentDialog.id!, {
      remainingAmount: newRemaining,
      status: newRemaining <= 0 ? 'paid' : 'partially_paid'
    });

    setShowPaymentDialog(null);
    setPaymentForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      note: ''
    });
    loadDebts();
    loadPayments();
  };

  const getDebtPayments = (debtId: number) => {
    return payments.filter(p => p.debtId === debtId).reverse();
  };

  // Calculate totals
  const owedToOthers = debts
    .filter(d => (d.status === 'pending' || d.status === 'partially_paid') && d.direction === 'borrow')
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  
  const owedByOthers = debts
    .filter(d => (d.status === 'pending' || d.status === 'partially_paid') && d.direction === 'lend')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const filteredDebts = debts.filter(debt => {
    if (activeTab === 'all') return true;
    if (activeTab === 'paid') return debt.status === 'paid';
    return debt.status !== 'paid';
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="status-badge status-paid">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('debts.statusPaid')}
          </span>
        );
      case 'partially_paid':
        return (
          <span className="status-badge status-pending">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('debts.statusPending')}
          </span>
        );
      default:
        return (
          <span className="status-badge status-active">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('debts.statusActive')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header with Totals */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{t('debts.title')}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('debts.addDebt')}
        </button>
      </div>

      {/* Summary Cards */}
      {(owedToOthers > 0 || owedByOthers > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {owedToOthers > 0 && (
            <div className="card text-center p-4">
              <p className="text-sm text-gray-500 mb-1">{t('debts.owedToOthers')}</p>
              <p className="text-xl font-bold text-rose-600">{formatCurrency(owedToOthers)}</p>
            </div>
          )}
          {owedByOthers > 0 && (
            <div className="card text-center p-4">
              <p className="text-sm text-gray-500 mb-1">{t('debts.owedByOthers')}</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(owedByOthers)}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('all')}
          className={`tab-btn ${activeTab === 'all' ? 'tab-btn-active' : ''}`}
        >
          {t('debts.tabAll')}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`tab-btn ${activeTab === 'pending' ? 'tab-btn-active' : ''}`}
        >
          {t('debts.tabActive')}
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`tab-btn ${activeTab === 'paid' ? 'tab-btn-active' : ''}`}
        >
          {t('debts.tabSettled')}
        </button>
      </div>

      {/* Debt List */}
      {filteredDebts.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="empty-state-title">{t('debts.noDebts')}</p>
          <p className="empty-state-description">{t('debts.emptyStateDescription')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDebts.map((debt) => {
            const debtPayments = getDebtPayments(debt.id!);
            const paidAmount = debt.originalAmount - debt.remainingAmount;
            
            return (
              <div key={debt.id} className="card">
                {/* Debt Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{debt.personName}</p>
                      {getStatusBadge(debt.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {debt.direction === 'borrow' ? t('debts.borrowedFrom') : t('debts.lentTo')}: {debt.description || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      debt.direction === 'borrow' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {formatCurrency(debt.direction === 'borrow' ? debt.remainingAmount : debt.remainingAmount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('debts.netBalance')}: {formatCurrency(debt.direction === 'borrow' ? -debt.remainingAmount : debt.remainingAmount)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                {debt.status !== 'pending' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{t('goals.progress')}</span>
                      <span className="text-gray-700">
                        {formatCurrency(paidAmount)} / {formatCurrency(debt.originalAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${debt.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${(paidAmount / debt.originalAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Payment Button (for pending/partially paid) */}
                {debt.status !== 'paid' && (
                  <button
                    onClick={() => setShowPaymentDialog(debt)}
                    className="w-full btn btn-primary mb-4"
                  >
                    {t('debts.settle')}
                  </button>
                )}

                {/* Payment History */}
                {debtPayments.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">{t('expense.paid')} {t('dashboard.expenses')}</p>
                    <div className="space-y-2">
                      {debtPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-600">{payment.paymentDate}</span>
                            {payment.note && <span className="text-gray-400 text-xs">- {payment.note}</span>}
                          </div>
                          <span className="font-medium text-emerald-600">-{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Debt Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('debts.addDebt')}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Direction Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'borrow' })}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    formData.direction === 'borrow'
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  💸 {t('debts.iOwe')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'lend' })}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    formData.direction === 'lend'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  💰 {t('debts.owedToMe')}
                </button>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {formData.direction === 'borrow' ? t('debts.creditorName') : t('debts.debtorName')}
                </label>
                <input
                  type="text"
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  className="input"
                  placeholder={formData.direction === 'borrow' ? t('debts.placeholderCreditor') : t('debts.placeholderDebtor')}
                  required
                />
              </div>

              {/* Original Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('debts.amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.originalAmount}
                  onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                  className="input"
                  required
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('debts.dueDate')}
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('transaction.description')}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder={t('common.optional')}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {t('debts.saveDebt')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('debts.settle')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {showPaymentDialog.personName} - {formatCurrency(showPaymentDialog.remainingAmount)} kalan
            </p>

            <div className="space-y-4">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ödeme Tutarı
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={showPaymentDialog.remainingAmount}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="input"
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kalan: {formatCurrency(showPaymentDialog.remainingAmount)}
                </p>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ödeme Tarihi
                </label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="input"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('transaction.description')}
                </label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="input"
                  placeholder={t('common.optional')}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentDialog(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={addPayment}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium"
              >
                {t('debts.settle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Debts;
